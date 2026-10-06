// Checks the privacy rules in schema.sql against a real Postgres (PGlite). Run: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

// Minimal stand-ins for what Supabase provides (roles, auth.uid(), storage tables)
const S = "11111111-1111-1111-1111-111111111111", A = "22222222-2222-2222-2222-222222222222", B = "33333333-3333-3333-3333-333333333333";
await db.exec(`
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth; create schema if not exists storage;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
create table if not exists storage.buckets (id text primary key, name text, public bool, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id serial primary key, bucket_id text, name text);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
grant usage on schema public, auth, storage to anon, authenticated;
grant all on storage.objects to authenticated; grant usage on all sequences in schema storage to authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
insert into auth.users values ('${S}','s@x'),('${A}','a@x'),('${B}','b@x') on conflict do nothing;
`);

await db.exec(schema);
await db.exec(schema); // idempotent
console.log("schema ran twice OK");

let fails = 0;
const as = async (uid, sql, params = []) => {
  await db.exec(`reset role; select set_config('request.uid', '${uid ?? ""}', false);`);
  await db.exec(uid ? "set role authenticated" : "set role anon");
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
};
const expect = (name, cond, extra = "") => { console.log((cond ? "PASS " : "FAIL ") + name + (extra ? "  " + extra : "")); if (!cond) fails++; };
const throws = async (name, fn) => { try { await fn(); expect(name, false, "(did not throw)"); } catch (e) { expect(name, true, "→ " + e.message.split("\n")[0]); } };

const app = (dob = "1995-04-03", extra = "") => `insert into applications (full_name, phone, gender, dob, profession, city, sect, practice, mother_tongue, education${extra ? "," + extra.split("=")[0] : ""})
  values ('Usman Tariq', '0300 1111111', 'M', '${dob}', 'Engineer', 'Lahore', 'Sunni', 'Practising', 'Punjabi', 'Master''s'${extra ? "," + extra.split("=")[1] : ""}) returning id, status, user_id`;

// A applies and tries to self-approve
let r = await as(A, app("1995-04-03", "status='approved'"));
expect("member insert forced to pending", r.rows[0].status === "pending" && r.rows[0].user_id === A);
const appA = r.rows[0].id;
await throws("under-18 rejected", () => as(B, app("2012-01-01")));
r = await as(A, `update applications set status='approved', pid='RG-9999' where id=$1 returning status, pid`, [appA]);
expect("member cannot approve self", r.rows[0].status === "pending" && r.rows[0].pid === null);
await throws("member cannot run approve rpc", () => as(A, `select approve_application($1)`, [appA]));
await throws("member cannot call next_pid", () => as(A, `select next_pid('F')`));
r = await as(B, `select * from applications`);
expect("other member cannot read A's application", r.rows.length === 0);

// make S staff and approve
await db.query(`insert into staff (user_id) values ($1)`, [S]);
r = await as(S, `select approve_application($1, null) as pid`, [appA]);
expect("staff approves → groom id", r.rows[0].pid === "RG-2001", r.rows[0].pid);
r = await as(S, `select approve_application($1, 'x.jpg') as pid`, [appA]);
expect("re-approve keeps same id", r.rows[0].pid === "RG-2001");
r = await as(A, `select status, pid from applications where id=$1`, [appA]);
expect("applicant sees approved + id", r.rows[0].status === "approved" && r.rows[0].pid === "RG-2001");

// B browses
r = await as(B, `select pid, first_name from profiles`);
expect("member sees published profile with first name only", r.rows.length === 1 && r.rows[0].first_name === "Usman");
r = await as(B, `select * from vault`);
expect("member cannot read vault", r.rows.length === 0);
r = await as(null, `select * from profiles`).catch(e => ({ rows: [], err: e.message }));
expect("signed-out visitor sees no profiles", r.rows.length === 0);
r = await as(null, `select phone from settings`);
expect("signed-out visitor reads bureau settings", r.rows.length === 1);
await throws("member cannot edit settings silently", async () => { const q = await as(B, `update settings set phone='x' returning id`); if (!q.rows.length) throw new Error("0 rows updated (blocked by RLS)"); });

// interests
await throws("unregistered member cannot send interest", () => as(B, `insert into interests (pid) values ('RG-2001')`));
await as(B, `insert into applications (full_name, phone, gender, dob, profession, city) values ('Ayesha Khan','0300 2','F','1998-03-14','Doctor','Lahore')`);
r = await as(B, `insert into interests (pid, status) values ('RG-2001','accepted') returning status, from_user`);
expect("interest insert forced to pending + own id", r.rows[0].status === "pending" && r.rows[0].from_user === B);
r = await as(B, `update interests set status='accepted' returning id`);
expect("member cannot change interest status", r.rows.length === 0);
r = await as(A, `select * from interests`);
expect("target member cannot see who is interested", r.rows.length === 0);
r = await as(S, `update interests set status='accepted' returning status`);
expect("staff sets interest status", r.rows[0]?.status === "accepted");
r = await as(B, `delete from interests returning id`);
expect("member cannot withdraw after acceptance", r.rows.length === 0);

// removal request + hidden + staff add + remove
r = await as(A, `update applications set status='removal' where id=$1 returning status`, [appA]);
expect("approved member can request removal", r.rows[0].status === "removal");
await as(S, `update profiles set hidden=true where pid='RG-2001'`);
r = await as(B, `select * from profiles`);
expect("hidden profile invisible to members", r.rows.length === 0);
r = await as(S, `select * from profiles`);
expect("staff still sees hidden profile", r.rows.length === 1);
r = await as(S, `select staff_add_profile('{"full_name":"Hira Malik","gender":"F","dob":"1996-07-02","phone":"0300 3","city":"Islamabad","profession":"Doctor"}'::jsonb, null, 'staff/x.jpg') as pid`);
expect("staff adds walk-in client → bride id", r.rows[0].pid === "RG-1001", r.rows[0].pid);
r = await as(S, `select photo_private, first_name from profiles where pid='RG-1001'`);
expect("walk-in private photo flagged", r.rows[0].photo_private === true && r.rows[0].first_name === "Hira");
await as(S, `select remove_profile('RG-2001')`);
r = await as(S, `select (select count(*) from profiles where pid='RG-2001')::int p, (select count(*) from vault where pid='RG-2001')::int v, (select status from applications where id='${appA}') s`);
expect("remove deletes profile + vault, marks application removed", r.rows[0].p === 0 && r.rows[0].v === 0 && r.rows[0].s === "removed");

// storage
await as(A, `insert into storage.objects (bucket_id, name) values ('private-photos', '${A}/photo.jpg')`);
await throws("member cannot write in someone else's private folder", () => as(A, `insert into storage.objects (bucket_id, name) values ('private-photos', '${B}/photo.jpg')`));
await throws("member cannot upload public photos", () => as(A, `insert into storage.objects (bucket_id, name) values ('public-photos', 'p.jpg')`));
r = await as(B, `select * from storage.objects where bucket_id='private-photos'`);
expect("member cannot see others' private photos", r.rows.length === 0);
r = await as(S, `select * from storage.objects where bucket_id='private-photos'`);
expect("staff sees private photos", r.rows.length === 1);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
