import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ur'
type Entry = string | ((...a: never[]) => string)

const en = {
  brand: 'Rishta Ghar', brandSub: 'Muslim Marriage Bureau',
  tabBrowse: 'Browse', tabShort: 'Shortlist', tabInt: 'My interests', tabReg: 'My profile', tabAdmin: 'Bureau desk',
  heroTitle: 'Halal rishtas, arranged with family in mind',
  heroText: 'Browse Muslim biodata, shortlist matches and send an interest through the bureau. The bureau speaks with both families and their wali before any contact details are shared.',
  hoursDefault: 'Mon–Sat 10am–7pm',
  lookingFor: 'Looking for', bride: 'Bride', groom: 'Groom', search: 'Search', searchPh: 'Profile ID, profession, city…', ageFrom: 'Age from', ageTo: 'to',
  sect: 'Sect', practice: 'Religious practice', city: 'City', education: 'Education', marital: 'Marital status',
  withPhoto: 'With visible photo only', verifiedOnly: 'Verified only', clear: 'Clear filters',
  sort: 'Sort', sortNew: 'Newest first', sortMatch: 'Best match for me', sortAgeA: 'Age, youngest', sortAgeD: 'Age, oldest', any: 'Any', filters: 'Filters',
  countLine: (n: number, g: string) => `${n} ${g === 'F' ? 'bride' : 'groom'} profile${n === 1 ? '' : 's'} match your filters`,
  noMatch: 'No profiles match these filters. Try widening the age range or clearing the city.',
  loading: 'Loading profiles…', loadFail: "Couldn't load profiles. Check your internet connection and try again.",
  noneT: 'No profiles published yet', noneAdmin: "Add a client's profile from the Bureau desk, or approve an application there.",
  noneUser: 'The bureau is adding profiles. Register your own under “My profile”.',
  shortEmptyT: 'Your shortlist is empty', shortEmptyB: 'Tap ♡ on any profile to save it here. Your shortlist stays on this device.',
  height: 'Height', deen: 'Deen', biodata: 'Biodata', sendInt: 'Send interest', intSent: 'Interest sent', yourProfile: 'Your profile', verified: '✓ Verified',
  privatePhoto: 'Private photo, shared by the bureau on interest', match: (n: number) => `${n}% match`, yrs: 'yrs',
  intsSentT: 'Interests you sent', howT: 'How it works',
  how1T: '1. Send an interest', how1: 'The bureau forwards your biodata to the family and wali.',
  how2T: '2. Family reviews', how2: 'Usually within 3–5 working days. Private photos are shared if they agree.',
  how3T: '3. Family meeting', how3: 'The bureau arranges a family meeting and contact numbers are exchanged.',
  noInts: 'No interests sent yet. Open a profile and choose “Send interest”.', gone: 'Profile no longer listed', sentOn: (d: string) => `sent ${d}`,
  willCall: 'The bureau will call you to arrange a family meeting.', withdraw: 'Withdraw',
  int_pending: 'With the bureau', int_accepted: 'Family agreed', int_declined: 'Not taken forward',
  orCall: (ph: string) => `You can also call or WhatsApp the bureau on ${ph}.`, copy: 'Copy', copied: 'Copied',
  close: 'Close', shortlisted: '♥ Shortlisted', shortlistBtn: '♡ Shortlist', addedShort: 'Added to shortlist', removedShort: 'Removed from shortlist',
  dlBio: 'Download biodata', dlPriv: 'With private photo', matchWhy: (n: number) => `Match with your biodata · ${n}%`, fewCommon: 'Few things in common',
  w_gap: (n: number) => `${n} yr age gap`, w_sameAge: 'Same age', w_olderBride: 'Bride slightly older', w_sect: (s: string) => `Both ${s}`,
  w_pr: 'Same level of practice', w_city: (c: string) => `Both in ${c}`, w_edu: 'Similar education', w_lang: (l: string) => `Both speak ${l}`,
  about: 'About', background: 'Background', bureauOnly: 'Bureau only', fullName: 'Full name', phoneL: 'Phone', guardianL: 'Wali / guardian',
  practiceL: 'Practice', salah: 'Salah', hijab: 'Hijab', caste: 'Caste / biradari', motherTongue: 'Mother tongue', profession: 'Profession',
  father: 'Father', siblings: 'Siblings', notSpec: 'Not specified',
  sharedNote: 'Full name, photos and contact details are shared by the bureau once both families agree.',
  notPublished: 'Not yet published', submittedOn: (d: string) => `submitted ${d}`, suggested: 'Suggested matches',
  noOpp: 'No published profiles of the opposite gender yet.', reject: 'Reject', approvePub: 'Approve and publish', approve: 'Approve',
  app_pending: 'Waiting for review', app_approved: 'Published', app_rejected: 'Not approved', app_removal: 'Removal requested', app_removed: 'Removed',
  addingT: "Adding a client's profile", addingB: 'It is published straight away. Phone, guardian, full name and private photos stay with the bureau.',
  publishBtn: 'Publish profile', submitBtn: 'Submit for review', submitChanges: 'Submit changes for review',
  regT: 'Register your biodata', regB: 'The bureau reviews every profile before it is published, usually within two working days.',
  stPending: (d: string) => `Submitted ${d}. You can still edit it below.`,
  stApproved: 'Your profile is live. Changes you submit go back to the bureau for review.',
  stRejected: 'The bureau will call you about this profile.', stRemoval: 'The bureau will take your profile down shortly.',
  stRemoved: 'Your profile has been removed. You can submit it again below.',
  viewMine: 'View my profile', askRemove: 'Ask to remove my profile',
  photoLg: 'Photo', noPhoto: 'No photo yet', upload: 'Upload a clear, recent photo',
  keepPrivate: 'Keep photo private. The bureau shares it only with families who are interested.', removePhoto: 'Remove photo',
  basicLg: 'Basic details', namePh: 'e.g. Ayesha Khan', firstOnly: 'Only the first name is shown publicly.', gender: 'Gender',
  genderF: 'Female (bride)', genderM: 'Male (groom)', dob: 'Date of birth', optional: 'Optional', langPh: 'e.g. Urdu',
  hijabDress: 'Hijab / dress', eduLg: 'Education & work', degree: 'Degree / field', degPh: 'e.g. BS Computer Science',
  jobPh: 'e.g. Software engineer', cityPh: 'e.g. Lahore', familyLg: 'Family', fatherOcc: "Father's occupation", faPh: 'e.g. Retired banker',
  sibPh: 'e.g. 2 brothers, 1 sister', aboutL: 'About and expectations', aboutPh: 'A few lines about yourself, your family and what you are looking for.',
  privLg: 'Private contact', privHint: '· seen only by the bureau', phoneWa: 'Phone / WhatsApp', wali: 'Wali or guardian',
  walPh: 'e.g. Father, Tariq Mahmood', cancel: 'Cancel',
  missing: (l: string) => `Please add the ${l}.`, join: ', ', m_full_name: 'full name', m_dob: 'date of birth', m_profession: 'profession',
  m_city: 'city', m_phone: 'phone number', under18: 'Profiles can only be registered for people aged 18 or over.',
  sentReview: 'Sent to the bureau for review', publishedAs: (pid: string) => `Published as ${pid}`, intSentToast: 'Interest sent to the bureau',
  withdrawn: 'Interest withdrawn', removalSent: 'The bureau has your removal request',
  registerFirst: 'Register your own biodata first, so the bureau can share it with the family.',
  registerForMatch: 'Register your biodata under “My profile” to see match scores.', chooseImg: 'Please choose an image file',
  badImg: 'That image could not be read. Try a JPG or PNG.', uploadFail: "Couldn't upload the photo. Check your connection and try again.",
  preparing: 'Preparing biodata…', bioSaved: 'Biodata saved', bioFail: "Couldn't create the biodata image.",
  errSave: "Couldn't save. Check your connection and try again.",
  addClient: "Add a client's profile", appsT: 'Applications to review',
  appsHint: 'Approve to publish. Phone, full name and private photos stay with the bureau.',
  intsT: 'Interests', intsHint: 'Call both families, then record the answer here.', profT: 'Published profiles',
  detailsT: 'Bureau details', detailsHint: 'Shown to every visitor.', hoursL: 'Office hours', addrL: 'Address', addrPh: 'Office address',
  saveDetails: 'Save details', detailsSaved: 'Bureau details saved',
  statWaiting: 'Waiting for review', statPublished: 'Published profiles', statOpen: 'Open interests',
  noApps: 'No applications waiting. New registrations appear here.', updating: (pid: string) => `updating ${pid}`, removeProfile: 'Remove profile',
  unregistered: 'Unregistered member', interestedIn: (pid: string) => `interested in ${pid}`, noLonger: 'no longer listed',
  noIntsAdmin: 'No interests yet.', thId: 'ID', thName: 'Name', thAge: 'Age', thStatus: 'Status', hiddenS: 'Hidden', liveS: 'Live',
  view: 'View', unverify: 'Unverify', markVer: 'Mark verified', showP: 'Show', hideP: 'Hide', remove: 'Remove', confirmRemove: 'Confirm remove',
  nothingPub: 'Nothing published yet.', rejectedToast: 'Application rejected', intUpdated: 'Interest updated',
  liveAgain: 'Profile is live again', hiddenToast: 'Profile hidden from visitors', removedPid: (pid: string) => `${pid} removed`,
  signInT: 'Sign in to see rishtas', signInB: "We'll email you a 6-digit code. No password needed.", email: 'Email',
  sendCode: 'Send code', codeL: '6-digit code', codeSent: (e: string) => `We sent a code to ${e}. It can take a minute to arrive.`,
  verify: 'Sign in', changeEmail: 'Use a different email', badCode: "That code didn't work. Check it, or ask for a new one.",
  badEmail: 'Please enter a valid email address.', codeFail: "Couldn't send the code. Wait a minute and try again.",
  signOut: 'Sign out', privacyNote: 'Only signed-in members can see profiles. Phone numbers and full names stay with the bureau.',
  install: 'Install app', iosInstall: 'To install on iPhone: tap the Share button, then “Add to Home Screen”.', gotIt: 'Got it',
  updateReady: 'A new version is ready.', reload: 'Update',
}

const ur: { [K in keyof typeof en]?: Entry } = {
  brand: 'رشتہ گھر', brandSub: 'مسلم میرج بیورو',
  tabBrowse: 'رشتے دیکھیں', tabShort: 'پسندیدہ', tabInt: 'میری دلچسپیاں', tabReg: 'میرا پروفائل', tabAdmin: 'بیورو ڈیسک',
  heroTitle: 'خاندان کی رضامندی سے حلال رشتے',
  heroText: 'مسلم رشتوں کے بائیوڈیٹا دیکھیں، پسندیدہ فہرست بنائیں اور بیورو کے ذریعے دلچسپی بھیجیں۔ رابطہ نمبر دینے سے پہلے بیورو دونوں خاندانوں اور ولی سے بات کرتا ہے۔',
  hoursDefault: 'پیر تا ہفتہ، صبح 10 تا شام 7',
  lookingFor: 'تلاش', bride: 'دلہن', groom: 'دولہا', search: 'تلاش کریں', searchPh: 'پروفائل نمبر، پیشہ، شہر…', ageFrom: 'عمر از', ageTo: 'تا',
  sect: 'مسلک', practice: 'دینداری', city: 'شہر', education: 'تعلیم', marital: 'ازدواجی حیثیت',
  withPhoto: 'صرف تصویر والے پروفائل', verifiedOnly: 'صرف تصدیق شدہ',
  sort: 'ترتیب', sortNew: 'نئے پہلے', sortMatch: 'میرے لیے بہترین جوڑ', sortAgeA: 'عمر، کم سے زیادہ', sortAgeD: 'عمر، زیادہ سے کم', any: 'کوئی بھی', filters: 'فلٹر',
  countLine: (n: number, g: string) => `${n} ${g === 'F' ? 'دلہن' : 'دولہا'} پروفائل آپ کے فلٹر سے ملتے ہیں`,
  noMatch: 'ان فلٹرز سے کوئی پروفائل نہیں ملا۔ عمر کی حد بڑھائیں یا شہر کا فلٹر ہٹائیں۔',
  loading: 'پروفائل لوڈ ہو رہے ہیں…', loadFail: 'پروفائل لوڈ نہیں ہو سکے۔ انٹرنیٹ کنکشن چیک کر کے دوبارہ کوشش کریں۔',
  noneT: 'ابھی کوئی پروفائل شائع نہیں ہوا', noneAdmin: 'بیورو ڈیسک سے کسی کلائنٹ کا پروفائل شامل کریں یا کوئی درخواست منظور کریں۔',
  noneUser: 'بیورو پروفائل شامل کر رہا ہے۔ اپنا بائیوڈیٹا ”میرا پروفائل“ میں درج کریں۔',
  shortEmptyT: 'آپ کی پسندیدہ فہرست خالی ہے', shortEmptyB: 'کسی بھی پروفائل پر ♡ دبا کر اسے یہاں محفوظ کریں۔ یہ فہرست صرف اسی ڈیوائس پر رہتی ہے۔',
  height: 'قد', deen: 'دین', yourProfile: 'آپ کا پروفائل', verified: '✓ تصدیق شدہ',
  privatePhoto: 'نجی تصویر، دلچسپی پر بیورو دکھائے گا', match: (n: number) => `${n}% موافقت`, yrs: 'سال',
  intsSentT: 'آپ کی بھیجی گئی دلچسپیاں', howT: 'طریقۂ کار',
  how1T: '1۔ دلچسپی بھیجیں', how1: 'بیورو آپ کا بائیوڈیٹا خاندان اور ولی تک پہنچاتا ہے۔',
  how2T: '2۔ خاندان غور کرتا ہے', how2: 'عموماً 3 سے 5 کاروباری دنوں میں۔ رضامندی پر نجی تصاویر دکھائی جاتی ہیں۔',
  how3T: '3۔ خاندانی ملاقات', how3: 'بیورو خاندانی ملاقات کا انتظام کرتا ہے اور رابطہ نمبر دیے جاتے ہیں۔',
  noInts: 'ابھی کوئی دلچسپی نہیں بھیجی گئی۔ کوئی پروفائل کھولیں اور ”Send interest“ دبائیں۔', gone: 'یہ پروفائل اب موجود نہیں', sentOn: (d: string) => `${d} کو بھیجی`,
  willCall: 'خاندانی ملاقات کے لیے بیورو آپ کو کال کرے گا۔',
  int_pending: 'بیورو کے پاس', int_accepted: 'خاندان راضی ہے', int_declined: 'آگے نہیں بڑھایا گیا',
  orCall: (ph: string) => `آپ بیورو کو ${ph} پر کال یا واٹس ایپ بھی کر سکتے ہیں۔`, copied: 'کاپی ہو گیا',
  addedShort: 'پسندیدہ فہرست میں شامل', removedShort: 'پسندیدہ فہرست سے ہٹا دیا',
  matchWhy: (n: number) => `آپ کے بائیوڈیٹا سے موافقت · ${n}%`, fewCommon: 'زیادہ باتیں مشترک نہیں',
  w_gap: (n: number) => `${n} سال کا فرق`, w_sameAge: 'ہم عمر', w_olderBride: 'دلہن قدرے بڑی', w_sect: (s: string) => `دونوں ${s}`,
  w_pr: 'دینداری یکساں', w_city: (c: string) => `دونوں ${c} میں`, w_edu: 'تعلیم ملتی جلتی', w_lang: (l: string) => `دونوں کی زبان ${l}`,
  about: 'تعارف', background: 'پس منظر', bureauOnly: 'صرف بیورو کے لیے', fullName: 'پورا نام', phoneL: 'فون', guardianL: 'ولی / سرپرست',
  practiceL: 'دینداری', salah: 'نماز', hijab: 'حجاب', caste: 'ذات / برادری', motherTongue: 'مادری زبان', profession: 'پیشہ',
  father: 'والد', siblings: 'بہن بھائی', notSpec: 'درج نہیں',
  sharedNote: 'دونوں خاندانوں کی رضامندی کے بعد بیورو پورا نام، تصاویر اور رابطہ تفصیلات فراہم کرتا ہے۔',
  notPublished: 'ابھی شائع نہیں ہوا', submittedOn: (d: string) => `${d} کو جمع کرایا`, suggested: 'تجویز کردہ رشتے',
  noOpp: 'ابھی مخالف جنس کا کوئی پروفائل شائع نہیں ہوا۔',
  app_pending: 'جائزے کا منتظر', app_approved: 'شائع شدہ', app_rejected: 'منظور نہیں ہوا', app_removal: 'ہٹانے کی درخواست', app_removed: 'ہٹا دیا گیا',
  addingT: 'کلائنٹ کا پروفائل شامل کیا جا رہا ہے', addingB: 'یہ فوراً شائع ہو جائے گا۔ فون، سرپرست، پورا نام اور نجی تصاویر صرف بیورو کے پاس رہیں گی۔',
  regT: 'اپنا بائیوڈیٹا درج کریں', regB: 'بیورو ہر پروفائل شائع کرنے سے پہلے دیکھتا ہے، عموماً دو کاروباری دنوں میں۔',
  stPending: (d: string) => `${d} کو جمع کرایا۔ آپ نیچے اب بھی تبدیلی کر سکتے ہیں۔`,
  stApproved: 'آپ کا پروفائل شائع ہے۔ آپ کی بھیجی گئی تبدیلیاں دوبارہ بیورو کے جائزے میں جائیں گی۔',
  stRejected: 'بیورو اس پروفائل کے بارے میں آپ کو کال کرے گا۔', stRemoval: 'بیورو جلد آپ کا پروفائل ہٹا دے گا۔',
  stRemoved: 'آپ کا پروفائل ہٹا دیا گیا ہے۔ آپ نیچے دوبارہ جمع کرا سکتے ہیں۔',
  photoLg: 'تصویر', noPhoto: 'ابھی تصویر نہیں', upload: 'صاف اور حالیہ تصویر اپ لوڈ کریں',
  keepPrivate: 'تصویر نجی رکھیں۔ بیورو صرف دلچسپی رکھنے والے خاندانوں کو دکھائے گا۔',
  basicLg: 'بنیادی معلومات', namePh: 'مثلاً عائشہ خان', firstOnly: 'عوامی طور پر صرف پہلا نام دکھایا جاتا ہے۔', gender: 'جنس',
  genderF: 'خاتون (دلہن)', genderM: 'مرد (دولہا)', dob: 'تاریخِ پیدائش', optional: 'اختیاری', langPh: 'مثلاً اردو',
  hijabDress: 'حجاب / لباس', eduLg: 'تعلیم اور ملازمت', degree: 'ڈگری / شعبہ', degPh: 'مثلاً بی ایس کمپیوٹر سائنس',
  jobPh: 'مثلاً سافٹ ویئر انجینئر', cityPh: 'مثلاً لاہور', familyLg: 'خاندان', fatherOcc: 'والد کا پیشہ', faPh: 'مثلاً ریٹائرڈ بینکار',
  sibPh: 'مثلاً 2 بھائی، 1 بہن', aboutL: 'تعارف اور توقعات', aboutPh: 'اپنے، اپنے خاندان اور مطلوبہ رشتے کے بارے میں چند سطریں۔',
  privLg: 'نجی رابطہ', privHint: '· صرف بیورو دیکھے گا', phoneWa: 'فون / واٹس ایپ', wali: 'ولی یا سرپرست', walPh: 'مثلاً والد، طارق محمود',
  missing: (l: string) => `براہِ کرم ${l} درج کریں۔`, join: '، ', m_full_name: 'پورا نام', m_dob: 'تاریخِ پیدائش', m_profession: 'پیشہ',
  m_city: 'شہر', m_phone: 'فون نمبر', under18: 'صرف 18 سال یا زائد عمر کے افراد کا پروفائل درج ہو سکتا ہے۔',
  sentReview: 'جائزے کے لیے بیورو کو بھیج دیا', publishedAs: (pid: string) => `${pid} کے نمبر سے شائع ہو گیا`, intSentToast: 'دلچسپی بیورو کو بھیج دی گئی',
  withdrawn: 'دلچسپی واپس لے لی', removalSent: 'ہٹانے کی درخواست بیورو کو مل گئی',
  registerFirst: 'پہلے اپنا بائیوڈیٹا درج کریں تاکہ بیورو اسے خاندان کو دکھا سکے۔',
  registerForMatch: 'موافقت دیکھنے کے لیے ”میرا پروفائل“ میں اپنا بائیوڈیٹا درج کریں۔', chooseImg: 'براہِ کرم تصویر کی فائل منتخب کریں',
  badImg: 'یہ تصویر نہیں کھل سکی۔ JPG یا PNG آزمائیں۔', uploadFail: 'تصویر اپ لوڈ نہیں ہو سکی۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
  preparing: 'بائیوڈیٹا تیار ہو رہا ہے…', bioSaved: 'بائیوڈیٹا محفوظ ہو گیا', bioFail: 'بائیوڈیٹا تصویر نہیں بن سکی۔',
  errSave: 'محفوظ نہیں ہو سکا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
  appsT: 'جائزے کے لیے درخواستیں', appsHint: 'منظوری پر شائع ہوگا۔ فون، پورا نام اور نجی تصاویر بیورو کے پاس رہیں گی۔',
  intsT: 'دلچسپیاں', intsHint: 'دونوں خاندانوں کو کال کریں، پھر جواب یہاں درج کریں۔', profT: 'شائع شدہ پروفائل',
  detailsT: 'بیورو کی معلومات', detailsHint: 'ہر وزیٹر کو نظر آتی ہیں۔', hoursL: 'دفتری اوقات', addrL: 'پتہ', addrPh: 'دفتر کا پتہ',
  detailsSaved: 'بیورو کی معلومات محفوظ ہو گئیں',
  statWaiting: 'جائزے کی منتظر', statPublished: 'شائع شدہ پروفائل', statOpen: 'زیرِ غور دلچسپیاں',
  noApps: 'کوئی درخواست زیرِ التوا نہیں۔ نئی رجسٹریشن یہاں نظر آئے گی۔', updating: (pid: string) => `${pid} کی تازہ کاری`,
  unregistered: 'غیر رجسٹرڈ رکن', interestedIn: (pid: string) => `${pid} میں دلچسپی`, noLonger: 'اب موجود نہیں',
  noIntsAdmin: 'ابھی کوئی دلچسپی نہیں۔', thId: 'نمبر', thName: 'نام', thAge: 'عمر', thStatus: 'حیثیت', hiddenS: 'پوشیدہ', liveS: 'شائع',
  nothingPub: 'ابھی کچھ شائع نہیں ہوا۔', rejectedToast: 'درخواست مسترد', intUpdated: 'دلچسپی اپ ڈیٹ ہو گئی',
  liveAgain: 'پروفائل دوبارہ شائع', hiddenToast: 'پروفائل وزیٹرز سے چھپا دیا', removedPid: (pid: string) => `${pid} ہٹا دیا گیا`,
  signInT: 'رشتے دیکھنے کے لیے سائن اِن کریں', signInB: 'ہم آپ کو ای میل پر 6 ہندسوں کا کوڈ بھیجیں گے۔ پاس ورڈ کی ضرورت نہیں۔', email: 'ای میل',
  codeL: '6 ہندسوں کا کوڈ', codeSent: (e: string) => `ہم نے ${e} پر کوڈ بھیجا ہے۔ آنے میں ایک منٹ لگ سکتا ہے۔`,
  badCode: 'یہ کوڈ درست نہیں۔ دوبارہ دیکھیں یا نیا کوڈ منگوائیں۔', badEmail: 'براہِ کرم درست ای میل درج کریں۔',
  codeFail: 'کوڈ نہیں بھیجا جا سکا۔ ایک منٹ بعد دوبارہ کوشش کریں۔',
  privacyNote: 'پروفائل صرف سائن اِن اراکین دیکھ سکتے ہیں۔ فون نمبر اور پورے نام صرف بیورو کے پاس رہتے ہیں۔',
  iosInstall: 'آئی فون پر انسٹال کرنے کے لیے: شیئر بٹن دبائیں، پھر ”Add to Home Screen“ منتخب کریں۔',
  updateReady: 'نیا ورژن تیار ہے۔',
}

export type Key = keyof typeof en

// Button labels stay in English in both languages (the bureau's choice).
const BUTTONS = new Set<Key>([
  'tabBrowse', 'tabShort', 'tabInt', 'tabReg', 'tabAdmin', 'bride', 'groom', 'clear', 'filters', 'biodata', 'sendInt', 'intSent',
  'withdraw', 'copy', 'close', 'shortlisted', 'shortlistBtn', 'dlBio', 'dlPriv', 'reject', 'approvePub', 'approve',
  'publishBtn', 'submitBtn', 'submitChanges', 'viewMine', 'askRemove', 'removePhoto', 'cancel', 'addClient', 'saveDetails',
  'removeProfile', 'view', 'unverify', 'markVer', 'showP', 'hideP', 'remove', 'confirmRemove', 'sendCode', 'verify',
  'changeEmail', 'signOut', 'install', 'gotIt', 'reload',
])

// Stored values stay in English; these are their Urdu display forms.
const VAL_UR: Record<string, string> = {
  'Sunni': 'سنی', 'Shia': 'شیعہ', 'Ahl-e-Hadith': 'اہلِ حدیث', 'Just Muslim': 'صرف مسلمان',
  'Very practising': 'بہت دیندار', 'Practising': 'دیندار', 'Moderately practising': 'معتدل دیندار',
  'Prays 5 times': 'پانچ وقت نماز', 'Prays regularly': 'باقاعدہ نماز', 'Sometimes': 'کبھی کبھار',
  'Wears hijab': 'حجاب', 'Wears niqab': 'نقاب', 'Dupatta': 'دوپٹہ', 'Does not cover': 'پردہ نہیں',
  "Bachelor's": 'بیچلرز', "Master's": 'ماسٹرز', 'Doctorate': 'ڈاکٹریٹ', 'Professional (MBBS / CA / LLB)': 'پیشہ ورانہ (MBBS / CA / LLB)',
  'Islamic education (Alim / Hafiz)': 'دینی تعلیم (عالم / حافظ)', 'Intermediate or below': 'انٹرمیڈیٹ یا کم',
  'Never married': 'غیر شادی شدہ', 'Divorced': 'طلاق یافتہ', 'Widowed': 'بیوہ / رنڈوا',
}

type Args<K extends Key> = (typeof en)[K] extends (...a: infer A) => string ? A : []

export interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: <K extends Key>(k: K, ...a: Args<K>) => string
  tv: (v: string) => string
  comma: string
  fmtDate: (iso: string | null | undefined) => string
}

const Ctx = createContext<I18n | null>(null)

function readLang(): Lang {
  try { return localStorage.getItem('rg:lang') === 'ur' ? 'ur' : 'en' } catch { return 'en' }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('rg:lang', l) } catch { /* private mode */ }
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
  }, [lang])

  const value = useMemo<I18n>(() => {
    const t = <K extends Key>(k: K, ...a: Args<K>): string => {
      const entry = (lang === 'ur' && !BUTTONS.has(k) ? ur[k] : undefined) ?? en[k]
      return typeof entry === 'function' ? (entry as (...x: unknown[]) => string)(...a) : entry
    }
    return {
      lang, setLang, t,
      tv: v => (lang === 'ur' ? VAL_UR[v] ?? v : v),
      comma: lang === 'ur' ? '،' : ',',
      fmtDate: iso => iso ? new Date(iso).toLocaleDateString(lang === 'ur' ? 'ur-PK' : undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n must be used inside I18nProvider')
  return v
}
