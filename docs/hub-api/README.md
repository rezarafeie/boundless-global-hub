# Rafiei Academy Hub API

The shared secret is stored as `HUB_SHARED_SECRET` in both projects. Only the Hub server calls this API; never put this secret in a browser or mobile app.

## Production transport

This academy is a React/Vite application with static Lovable hosting, not a TanStack server application. It implements the **edge-function transport explicitly allowed by the Hub contract**:

```
GET  https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api/health
POST https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api/{action}
```

If the Hub builds URLs by appending `/api/public/hub/{action}`, set its academy base to:

```
https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api
```

The resulting `/hub-api/api/public/hub/{action}` path is also accepted. No Hub changes are made from this project. `/api/public/hub/*` on `academy.rafiei.co` is **not** a production server route on this static host; that exact origin would require an external reverse proxy or a separately approved server-framework migration. Do not use Vite proxies or `_redirects` as a production solution.

## Headers

- `Authorization: Bearer <HUB_SHARED_SECRET>` — required for health and every action; mismatches return 401 using a fixed-length digest comparison.
- `X-Hub-User: <encodeURIComponent(JSON.stringify({hub_user_id,email,name}))>` — required for user actions; optional on catalog actions. Email must be verified by the Hub.
- `X-Hub-Source: rafiei-hub` — enforced when provided; the server always logs this source.
- `Content-Type: application/json`

Responses always have one top-level `data` field. Success: `{"data": ...}`; errors: `{"data":{"error":"Persian message"}}` with an appropriate non-200 HTTP status. Invalid input: 400; access denied: 403; identity conflict: 409; missing test payment: 402; provider temporarily unavailable: 502. Successful health returns `{"data":{"ok":true}}`.

## Actions

| Action | Payload | Data |
|---|---|---|
| courses.list | `{}` | `[{slug,title,summary,image_url,category,badge,is_free,is_coming_soon,price_toman}]` |
| course.get | `{slug}` | course plus `lessons:[{id,title,body,video_url,file_url,duration_min,is_preview,section}]` |
| me.enrollments | `{}` | `[{slug,title,image_url}]` |
| course.enroll | `{slug}` | `{enrolled:true}` or `{payment_url}` |
| me.progress | `{slug}` | `['lessonId', ...]` |
| lesson.complete / lesson.uncomplete | `{lesson_id}` | `{ok:true}` |
| tests.list | `{}` | `[{id,slug,title,description,duration_min,question_count}]` |
| test.get | `{slug}` | `{slug,title,description,duration_min,questions:[{id,text,options:[{value,label}]}]}` |
| test.submit | `{slug,answers:{[id]:value},birth_year,sex}` | `{attempt_id,result_html}` |
| me.tests | `{}` | `[{attempt_id,slug,title,created_at}]` |
| test.result | `{attempt_id}` | `{result_html}` |
| support.create | `{subject,message}` | `{id}` |
| me.tickets | `{}` | `[{id,subject,message,status,created_at}]` |

## Academy behavior

- Server-only `hub_resolve_user` requires the existing verified Hub link and current proven email. It never creates accounts, matches a new header to an old account, or merges accounts. Older email-only Hub mappings must complete verified authentication and explicit linking before private actions work. Overlapping chat/academy accounts require manual ownership review; this API will not create another chat account for an academy-only record.
- The Hub contract contains no phone field. Missing phone is stored as null, never invented. Website enrollment still requires a phone; only an authenticated, mapped Hub free-course enrollment can omit it.
- Free enrollment delegates to `create-enrollment`; paid enrollment delegates to `rafieipay-request` at the server's real effective price. No payment is marked completed before existing provider verification. Already-completed registrations are reused.
- Content is only returned to the mapped user with a completed registration and valid course access window. No lesson preview flag exists in the academy schema; lessons are not guessed to be previews. Locked lessons return empty body and null video/file URLs.
- Completion uses the existing progress table and mission/reward lifecycle. Uncompletion clears the saved completion flag; it does not revoke earned rewards or restart old follow-ups.
- Question rows and answer values use the existing Esanj JSON format. Birth year is Gregorian; sex is `male` or `female`. Employee creation converts the year to Esanj's Persian-year convention, matching the academy's existing adapter. Informational blocks are omitted. Answers are checked against all real questions before submission. Paid tests require an unused completed test purchase. Esanj UUIDs and attempts are stored before provider work; successful result HTML is saved in both the existing academy and Hub formats before returning success, and `test.result` can recover a delayed result without a new submission.
- Ticket conversations and messages use the existing support system and active default support room; no separate ticket application is created.
- Activity logs include action, mapped academy user, outcome and source, but no credentials, raw test answers or result HTML. Requests without a user are recorded in analytics using a random session identifier.
- Catalog fields not present in the academy data (`category`, `badge`, test duration and test question count) are null rather than fabricated.
- Course cover URLs reuse the academy's current asset pointers and cover-selection rules. Refresh the function's asset-pointer manifest when academy cover assets change.
- The custom-domain cover request timed out from this sandbox, so cover delivery from that domain is not verified here.
- Some Esanj questionnaires (verified for test `-2`) return empty question titles and null answer labels. Those tests return an honest Persian 502 rather than invented questions. Readable tests such as `-cmhq` support the full submission/result flow. Provider content availability is outside this app's control.

## Verification

Run `deno test supabase/functions/hub-api/hub-policy_test.ts` for contract validation. Explicit live checks use `HUB_API_LIVE_TESTS=1 deno test --allow-env=HUB_API_LIVE_TESTS,HUB_SHARED_SECRET --allow-net=ihhetvwuhqohbfgkqoxw.supabase.co supabase/functions/hub-api/hub-live_test.ts`. These create clearly named QA records, a support ticket and a pending checkout, and consume one real Esanj test attempt. Supply the secret from the environment without printing it. A paid checkout URL test does not prove a payment succeeded.

## ورود مشترک هاب — نسخه ۱

آدرس API تغییر نکرده است. تمام عملیات زیر فقط از سرور هاب، با همان `HUB_SHARED_SECRET`، اجرا می‌شوند؛ نشست آکادمی، توکن Supabase و رمز حساب هرگز در پاسخ هاب قرار نمی‌گیرند.

| عملیات | ورودی | `data` |
|---|---|---|
| `auth.capabilities` | `{}` | `{version:1,password,email_otp,sms_otp,session_exchange,account_link}` |
| `auth.password` | `{identifier,password,audience:'rafiei-hub'}` | `{exchange_ticket}` |
| `auth.otp.send` | `{identifier,channel:'email'\|'sms',purpose:'login'}` | `{request_id,expires_in:120,retry_after:60,destination,code_length:6}` |
| `auth.otp.verify` | `{request_id,code,audience:'rafiei-hub'}` | `{exchange_ticket}` |
| `auth.exchange` | `{exchange_ticket,audience:'rafiei-hub'}` | مشخصات دقیق حساب زیر |
| `account.link` | `{source_user_id}` + هدر `X-Hub-User` | `{ok:true}` |
| `auth.email.send` | `{exchange_ticket,email,audience:'rafiei-hub'}` | قرارداد ارسال OTP؛ ادامهٔ تأیید ایمیل برای حساب شماره‌ای/ایمیل تأییدنشده |

خروجی دقیق تبادل:

```json
{"data":{"source_user_id":"شناسه عددی ثابت حساب فعلی به صورت رشته","email":"ایمیل واقعی اثبات‌شده","email_verified":true,"name":"نام ذخیره‌شده حساب","phone":"+989xxxxxxxxx یا null","phone_verified":false,"authenticated_at":"UTC ISO با Z","audience":"rafiei-hub"}}
```

### ترتیب صحیح

۱. از `auth.capabilities` قابلیت‌های آزمایش‌شده را بخوانید؛ مقدار `false` را در رابط هاب آماده معرفی نکنید.

۲. رمز حساب موجود یا کد ارسال‌شده را تأیید کنید. بررسی bcrypt فقط روی سرور انجام می‌شود. هیچ عملیات ورود، حساب جدید ایجاد نمی‌کند. در ارسال کد، رفتار حساب موجود، ناموجود و متداخل یکسان است و مقصد ماسک می‌شود.

۳. تیکت تصادفی را فوراً با `auth.exchange` تبادل کنید؛ مهلت آن حداکثر ۶۰ ثانیه است. در نبود ایمیل اثبات‌شده، پاسخ ۴۰۳ است و تیکت هنوز برای ادامهٔ تأیید ایمیل قابل استفاده است: آن را با ایمیل واقعی به `auth.email.send` بدهید؛ این عملیات تیکت قبلی را مصرف می‌کند و OTP تازه می‌سازد. سپس همان `auth.otp.verify` و تبادل تیکت جدید را انجام دهید. ایمیلِ موجود قابل جایگزینی نیست؛ تغییر ایمیل حساب به بررسی مالکیت جداگانه نیاز دارد.

۴. هاب باید کاربر فعلی خود را با ایمیل **اثبات‌شدهٔ خروجی تبادل** بشناسد؛ حداکثر ظرف پنج دقیقه، همان `source_user_id` را به `account.link` همراه هدر معتبر آن کاربر بدهد. درخواست پیوند با حدس شناسه حساب، بدون شواهد تبادل اخیر، پذیرفته نمی‌شود. نام هدر جای نام حساب قبلی را نمی‌گیرد.

۵. همهٔ درخواست‌های خصوصی بعدی به پیوند ثبت‌شده و ایمیل اثبات‌شده متکی‌اند. دوره‌ها، آزمون‌ها، پیشرفت و پشتیبانی از همان جدول‌های آکادمی خوانده می‌شوند. پرداخت آزمون بر اساس `user_id` همان حساب کنترل می‌شود، نه صرفاً ایمیل؛ قیمت، دسترسی و پرداخت همچنان از جریان موجود آکادمی پیروی می‌کنند.

### امنیت و تاریخچه قدیمی

- کد شش‌رقمی با مولد امن و HMAC وابسته به شناسه درخواست ذخیره می‌شود؛ کد خام در جدول یا لاگ نیست. انقضا ۱۲۰ ثانیه، فاصله ارسال ۶۰ ثانیه، پنج تلاش و پنج ارسال برای هر مقصد در ساعت است. محدودیت مستقل سراسری ۳۰۰ درخواست احراز هویت در دقیقه، رمز ده درخواست برای هر شناسه در دقیقه و تأیید ۳۰ درخواست برای هر درخواست در دقیقه است؛ سربرگ IP جعلی محدودیت سراسری را دور نمی‌زند.
- بررسی/مصرف کد و تیکت با قفل ردیف در تراکنش انجام می‌شود؛ دو درخواست هم‌زمان فقط یک موفقیت دارند. تیکت فقط به صورت HMAC، با audience ثابت، ذخیره می‌شود.
- پیامک از کاوه‌نگار با `KAVENEGAR_API_KEY` و `KAVENEGAR_VERIFY_TEMPLATE` در اسرار همین اپ ارسال می‌شود. الگوی موجود `academylogin` است؛ بدون آزمایش تحویل، آماده معرفی نشده است. ارسال ایمیل از سرویس Gmail موجود آکادمی و قالب OTP موجود استفاده می‌کند؛ سرویس ایمیل جدید یا نشست مشترک ساخته نشده است.
- OTP پیامک فقط همان شماره زمان ارسال را اثبات می‌کند؛ تغییر شماره پیش از تأیید، شماره جدید را تأیید نمی‌کند.
- جدول‌های درخواست، تیکت، اثبات، محدودیت و آمادگی فقط برای `service_role` قابل دسترس هستند. متادیتای فعالیت فقط عملیات، شناسه حساب پس از احراز، وضعیت و منبع را ثبت می‌کند؛ کد، رمز، شماره کامل، URL کاوه‌نگار، کلید و تیکت ثبت نمی‌شوند.
- ردیف‌های قدیمیِ بدون مالک فقط وقتی ایمیل و/یا شماره مرتبط واقعاً اثبات شده و شناسه دیگر متداخل نباشد، به حساب فعلی وصل می‌شوند. ردیف متصل به حساب دیگر خودکار جابه‌جا نمی‌شود. حساب‌های هم‌پوشان در `chat_users` و `academy_users` پاسخ ۴۰۹/بررسی مالکیت می‌گیرند؛ ادغام و ساخت حساب جایگزین ممنوع است.
- این اپ موتور یا جدول پروژه‌های بیلدر/استودیو/ادیتور ندارد؛ این API تاریخچه‌ای برای آن‌ها جعل نمی‌کند و اعتبارشان را دور نمی‌زند. اپ مالک آن پروژه‌ها باید همین پیوند با شناسه ثابت خودش را اجرا کند؛ آکادمی دیتابیس اپ‌های دیگر را نمی‌خواند.

### نتیجه آزمون و آمادگی فعلی

- `password`, `session_exchange`, `account_link`: آزمایش HTTP واقعی روی حساب QA مجزا، رمز درست/غلط، تبادل هم‌زمان/مصرف‌شده/منقضی، پیوند متداخل ۴۰۹، نام ثابت و خواندن تاریخچه ذخیره‌شده غیرخالی موفق بود. حساب و داده‌های QA پس از آزمون حذف شدند؛ حساب واقعی هیچ کاربری تکثیر یا ادغام نشد.
- کد هم‌زمان، مصرف دوباره، انقضا، سقف پنج تلاش، تغییر شماره، سقف پنج ارسال و فاصله ۶۰ ثانیه با API/توابع واقعی دیتابیس آزمایش شدند.
- ارسال ایمیل از Gmail موجود، دریافت کد تازه توسط کاربر، تأیید OTP و تبادل هویت حساب واقعی موفق شدند؛ مصرف دوبارهٔ کد و تیکت هر دو ۴۰۱ شدند. کد قبلیِ بیش از ۱۲۰ ثانیه نیز درست رد شده بود. `email_otp:true` است؛ `sms_otp:false` می‌ماند تا ارسال و دریافت واقعی با مقصد مجاز آزمایش شود. مقدار موقت کد آزمایش پس از پایان از اسرار حذف شد.
- حساب واقعی همان حساب قبلی و دارای ثبت‌نام، پیشرفت، آزمون و پشتیبانی غیرخالی بود. هنوز شناسه واقعی هاب آن حساب ارائه نشده است؛ برای کاربر واقعی پیوند ساختگی ایجاد نشد. دریافت کامل تاریخچه از API هاب پس از `account.link` با شناسه واقعی هاب باید آزمایش شود؛ شمارش دیتابیس به‌تنهایی معادل این آزمایش نیست.
- `auth-policy_test.ts` آزمون‌های بدون ارسال، `auth-http_test.ts` آزمون HTTP با fixture خصوصی، `auth-live_test.ts` آزمون اختیاری با دسترسی سرویس و `auth-rate_test.sql` آزمون تراکنشی نرخ را نگه می‌دارند. اجرای آزمون HTTP نیاز به آماده‌سازی صریح fixture در محیط آزمایشی دارد؛ فایل‌های موقت حاوی رمز/کد نباید چاپ یا وارد گیت شوند.

آزمون‌های قدیمی `hub-live_test.ts` مربوط به قرارداد قبل از الزام پیوند هستند و دیگر نباید با فرض ساخت خودکار حساب اجرا شوند؛ از fixture دارای پیوند تأییدشده استفاده کنید و خرید/مصرف آزمون واقعی را بدون رضایت اجرا نکنید.