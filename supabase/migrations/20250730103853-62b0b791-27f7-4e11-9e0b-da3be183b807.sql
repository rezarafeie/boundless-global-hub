-- Create enums for new user fields
CREATE TYPE gender_type AS ENUM ('male', 'female');

CREATE TYPE specialized_program_type AS ENUM (
  'drop_shipping',
  'drop_servicing', 
  'digital_goods',
  'ai'
);

CREATE TYPE iran_province_type AS ENUM (
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'اردبیل',
  'اصفهان',
  'البرز',
  'ایلام',
  'بوشهر',
  'تهران',
  'چهارمحال و بختیاری',
  'خراسان جنوبی',
  'خراسان رضوی',
  'خراسان شمالی',
  'خوزستان',
  'زنجان',
  'سمنان',
  'سیستان و بلوچستان',
  'فارس',
  'قزوین',
  'قم',
  'کردستان',
  'کرمان',
  'کرمانشاه',
  'کهگیلویه و بویراحمد',
  'گلستان',
  'گیلان',
  'لرستان',
  'مازندران',
  'مرکزی',
  'هرمزگان',
  'همدان',
  'یزد'
);

-- Add new columns to chat_users table
ALTER TABLE public.chat_users 
ADD COLUMN gender gender_type,
ADD COLUMN age INTEGER CHECK (age > 0 AND age < 150),
ADD COLUMN education TEXT,
ADD COLUMN job TEXT,
ADD COLUMN specialized_program specialized_program_type,
ADD COLUMN country TEXT,
ADD COLUMN province iran_province_type;