-- Create arabic_phrases table for language learning feature
CREATE TABLE IF NOT EXISTS public.arabic_phrases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    arabic_text TEXT NOT NULL,
    english_text TEXT NOT NULL,
    pronunciation TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for tracking daily Arabic phrases
CREATE TABLE IF NOT EXISTS public.daily_arabic_phrase (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phrase_id UUID REFERENCES public.arabic_phrases(id) ON DELETE CASCADE,
    display_date DATE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_arabic_phrases_category ON public.arabic_phrases(category);
CREATE INDEX idx_arabic_phrases_difficulty ON public.arabic_phrases(difficulty);
CREATE INDEX idx_arabic_phrases_is_active ON public.arabic_phrases(is_active);
CREATE INDEX idx_daily_arabic_phrase_date ON public.daily_arabic_phrase(display_date);

-- Enable RLS
ALTER TABLE public.arabic_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_arabic_phrase ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Arabic phrases are viewable by everyone" ON public.arabic_phrases
    FOR SELECT USING (is_active = true);

CREATE POLICY "Daily Arabic phrase is viewable by everyone" ON public.daily_arabic_phrase
    FOR SELECT USING (true);

-- Admin policies for authenticated users with admin role
CREATE POLICY "Admins can manage Arabic phrases" ON public.arabic_phrases
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage daily Arabic phrases" ON public.daily_arabic_phrase
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_arabic_phrases_updated_at BEFORE UPDATE ON public.arabic_phrases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial Arabic phrases (300 common phrases)
INSERT INTO public.arabic_phrases (arabic_text, english_text, pronunciation, category, difficulty) VALUES
-- Greetings & Basic Courtesy (30 phrases)
('مرحبا', 'Hello', 'Marhaba', 'greetings', 'beginner'),
('صباح الخير', 'Good morning', 'Sabah al-khayr', 'greetings', 'beginner'),
('مساء الخير', 'Good evening', 'Masa al-khayr', 'greetings', 'beginner'),
('أهلاً وسهلاً', 'Welcome', 'Ahlan wa sahlan', 'greetings', 'beginner'),
('السلام عليكم', 'Peace be upon you', 'As-salamu alaykum', 'greetings', 'beginner'),
('وعليكم السلام', 'And peace be upon you', 'Wa alaykum as-salam', 'greetings', 'beginner'),
('كيف حالك؟', 'How are you?', 'Kayf haluk?', 'greetings', 'beginner'),
('بخير، الحمد لله', 'Fine, thank God', 'Bikhayr, alhamdulillah', 'greetings', 'beginner'),
('شكراً', 'Thank you', 'Shukran', 'greetings', 'beginner'),
('عفواً', 'You''re welcome', 'Afwan', 'greetings', 'beginner'),
('من فضلك', 'Please', 'Min fadlik', 'greetings', 'beginner'),
('آسف', 'Sorry', 'Asif', 'greetings', 'beginner'),
('عذراً', 'Excuse me', 'Udhran', 'greetings', 'beginner'),
('مع السلامة', 'Goodbye', 'Ma''a as-salama', 'greetings', 'beginner'),
('إلى اللقاء', 'See you later', 'Ila al-liqa', 'greetings', 'beginner'),
('تصبح على خير', 'Good night', 'Tusbih ala khayr', 'greetings', 'beginner'),
('نعم', 'Yes', 'Na''am', 'greetings', 'beginner'),
('لا', 'No', 'La', 'greetings', 'beginner'),
('ربما', 'Maybe', 'Rubbama', 'greetings', 'intermediate'),
('بالطبع', 'Of course', 'Bil-tab''', 'greetings', 'intermediate'),
('إن شاء الله', 'God willing', 'In sha Allah', 'greetings', 'beginner'),
('ما شاء الله', 'What God wills', 'Ma sha Allah', 'greetings', 'intermediate'),
('الله يبارك فيك', 'God bless you', 'Allah yubarik fik', 'greetings', 'intermediate'),
('تفضل', 'Please, go ahead', 'Tafaddal', 'greetings', 'intermediate'),
('أتشرف بمعرفتك', 'Nice to meet you', 'Atasharraf bi-ma''rifatik', 'greetings', 'intermediate'),
('ما اسمك؟', 'What is your name?', 'Ma ismuk?', 'greetings', 'beginner'),
('اسمي...', 'My name is...', 'Ismi...', 'greetings', 'beginner'),
('من أين أنت؟', 'Where are you from?', 'Min ayna anta?', 'greetings', 'intermediate'),
('أنا من...', 'I am from...', 'Ana min...', 'greetings', 'intermediate'),
('تشرفنا', 'It''s our pleasure', 'Tasharrafna', 'greetings', 'advanced'),

-- Numbers & Time (25 phrases)
('واحد', 'One', 'Wahid', 'numbers', 'beginner'),
('اثنان', 'Two', 'Ithnan', 'numbers', 'beginner'),
('ثلاثة', 'Three', 'Thalatha', 'numbers', 'beginner'),
('أربعة', 'Four', 'Arba''a', 'numbers', 'beginner'),
('خمسة', 'Five', 'Khamsa', 'numbers', 'beginner'),
('ستة', 'Six', 'Sitta', 'numbers', 'beginner'),
('سبعة', 'Seven', 'Sab''a', 'numbers', 'beginner'),
('ثمانية', 'Eight', 'Thamaniya', 'numbers', 'beginner'),
('تسعة', 'Nine', 'Tis''a', 'numbers', 'beginner'),
('عشرة', 'Ten', 'Ashara', 'numbers', 'beginner'),
('عشرون', 'Twenty', 'Ishrun', 'numbers', 'intermediate'),
('ثلاثون', 'Thirty', 'Thalathun', 'numbers', 'intermediate'),
('مائة', 'Hundred', 'Mi''a', 'numbers', 'intermediate'),
('ألف', 'Thousand', 'Alf', 'numbers', 'intermediate'),
('كم الساعة؟', 'What time is it?', 'Kam as-sa''a?', 'numbers', 'beginner'),
('الساعة...', 'It''s ... o''clock', 'As-sa''a...', 'numbers', 'beginner'),
('دقيقة', 'Minute', 'Daqiqa', 'numbers', 'intermediate'),
('ساعة', 'Hour', 'Sa''a', 'numbers', 'beginner'),
('يوم', 'Day', 'Yawm', 'numbers', 'beginner'),
('أسبوع', 'Week', 'Usbu''', 'numbers', 'beginner'),
('شهر', 'Month', 'Shahr', 'numbers', 'beginner'),
('سنة', 'Year', 'Sana', 'numbers', 'beginner'),
('اليوم', 'Today', 'Al-yawm', 'numbers', 'beginner'),
('أمس', 'Yesterday', 'Ams', 'numbers', 'intermediate'),
('غداً', 'Tomorrow', 'Ghadan', 'numbers', 'intermediate'),

-- Directions & Places (30 phrases)
('أين؟', 'Where?', 'Ayna?', 'directions', 'beginner'),
('هنا', 'Here', 'Huna', 'directions', 'beginner'),
('هناك', 'There', 'Hunak', 'directions', 'beginner'),
('يمين', 'Right', 'Yamin', 'directions', 'beginner'),
('يسار', 'Left', 'Yasar', 'directions', 'beginner'),
('أمام', 'In front', 'Amam', 'directions', 'beginner'),
('خلف', 'Behind', 'Khalf', 'directions', 'beginner'),
('بجانب', 'Next to', 'Bi-janib', 'directions', 'intermediate'),
('قريب', 'Near', 'Qarib', 'directions', 'beginner'),
('بعيد', 'Far', 'Ba''id', 'directions', 'beginner'),
('شارع', 'Street', 'Shari''', 'directions', 'beginner'),
('طريق', 'Road', 'Tariq', 'directions', 'beginner'),
('مبنى', 'Building', 'Mabna', 'directions', 'intermediate'),
('فندق', 'Hotel', 'Funduq', 'directions', 'beginner'),
('مطعم', 'Restaurant', 'Mat''am', 'directions', 'beginner'),
('مطار', 'Airport', 'Matar', 'directions', 'beginner'),
('محطة', 'Station', 'Mahatta', 'directions', 'intermediate'),
('مسجد', 'Mosque', 'Masjid', 'directions', 'beginner'),
('سوق', 'Market', 'Suq', 'directions', 'beginner'),
('مستشفى', 'Hospital', 'Mustashfa', 'directions', 'intermediate'),
('صيدلية', 'Pharmacy', 'Saydaliyya', 'directions', 'intermediate'),
('بنك', 'Bank', 'Bank', 'directions', 'beginner'),
('شاطئ', 'Beach', 'Shati''', 'directions', 'intermediate'),
('مول', 'Mall', 'Mall', 'directions', 'beginner'),
('مكتب', 'Office', 'Maktab', 'directions', 'intermediate'),
('مدرسة', 'School', 'Madrasa', 'directions', 'intermediate'),
('جامعة', 'University', 'Jami''a', 'directions', 'advanced'),
('حديقة', 'Park', 'Hadiqa', 'directions', 'intermediate'),
('موقف السيارات', 'Parking', 'Mawqif as-sayyarat', 'directions', 'intermediate'),
('كيف أذهب إلى...؟', 'How do I go to...?', 'Kayf adhhab ila...?', 'directions', 'intermediate'),

-- Food & Dining (35 phrases)
('طعام', 'Food', 'Ta''am', 'food', 'beginner'),
('ماء', 'Water', 'Ma''', 'food', 'beginner'),
('خبز', 'Bread', 'Khubz', 'food', 'beginner'),
('لحم', 'Meat', 'Lahm', 'food', 'beginner'),
('دجاج', 'Chicken', 'Dajaj', 'food', 'beginner'),
('سمك', 'Fish', 'Samak', 'food', 'beginner'),
('أرز', 'Rice', 'Aruzz', 'food', 'beginner'),
('خضروات', 'Vegetables', 'Khadrawat', 'food', 'intermediate'),
('فواكه', 'Fruits', 'Fawakih', 'food', 'intermediate'),
('قهوة', 'Coffee', 'Qahwa', 'food', 'beginner'),
('شاي', 'Tea', 'Shay', 'food', 'beginner'),
('عصير', 'Juice', 'Asir', 'food', 'beginner'),
('حليب', 'Milk', 'Halib', 'food', 'beginner'),
('سكر', 'Sugar', 'Sukkar', 'food', 'beginner'),
('ملح', 'Salt', 'Milh', 'food', 'beginner'),
('فلفل', 'Pepper', 'Filfil', 'food', 'intermediate'),
('حار', 'Spicy', 'Har', 'food', 'intermediate'),
('بارد', 'Cold', 'Barid', 'food', 'beginner'),
('ساخن', 'Hot', 'Sakhin', 'food', 'beginner'),
('لذيذ', 'Delicious', 'Ladhidh', 'food', 'intermediate'),
('جائع', 'Hungry', 'Ja''i''', 'food', 'intermediate'),
('عطشان', 'Thirsty', 'Atshan', 'food', 'intermediate'),
('فطور', 'Breakfast', 'Futur', 'food', 'intermediate'),
('غداء', 'Lunch', 'Ghada''', 'food', 'intermediate'),
('عشاء', 'Dinner', 'Asha''', 'food', 'intermediate'),
('القائمة', 'Menu', 'Al-qa''ima', 'food', 'intermediate'),
('الحساب', 'Bill', 'Al-hisab', 'food', 'intermediate'),
('أريد...', 'I want...', 'Urid...', 'food', 'beginner'),
('هل يمكنني...؟', 'Can I...?', 'Hal yumkinuni...?', 'food', 'intermediate'),
('بدون...', 'Without...', 'Bidun...', 'food', 'intermediate'),
('مع...', 'With...', 'Ma''a...', 'food', 'beginner'),
('نباتي', 'Vegetarian', 'Nabati', 'food', 'advanced'),
('حلال', 'Halal', 'Halal', 'food', 'beginner'),
('طازج', 'Fresh', 'Tazij', 'food', 'intermediate'),
('مقلي', 'Fried', 'Maqli', 'food', 'intermediate'),

-- Shopping & Money (25 phrases)
('كم السعر؟', 'How much?', 'Kam as-si''r?', 'shopping', 'beginner'),
('غالي', 'Expensive', 'Ghali', 'shopping', 'beginner'),
('رخيص', 'Cheap', 'Rakhis', 'shopping', 'beginner'),
('درهم', 'Dirham', 'Dirham', 'shopping', 'beginner'),
('فلوس', 'Money', 'Flus', 'shopping', 'beginner'),
('نقد', 'Cash', 'Naqd', 'shopping', 'intermediate'),
('بطاقة', 'Card', 'Bitaqa', 'shopping', 'intermediate'),
('أشتري', 'I buy', 'Ashtari', 'shopping', 'intermediate'),
('أبيع', 'I sell', 'Abi''', 'shopping', 'intermediate'),
('تخفيض', 'Discount', 'Takhfid', 'shopping', 'intermediate'),
('عرض', 'Offer', 'Ard', 'shopping', 'intermediate'),
('جديد', 'New', 'Jadid', 'shopping', 'beginner'),
('قديم', 'Old', 'Qadim', 'shopping', 'beginner'),
('كبير', 'Big', 'Kabir', 'shopping', 'beginner'),
('صغير', 'Small', 'Saghir', 'shopping', 'beginner'),
('لون', 'Color', 'Lawn', 'shopping', 'intermediate'),
('أحمر', 'Red', 'Ahmar', 'shopping', 'intermediate'),
('أزرق', 'Blue', 'Azraq', 'shopping', 'intermediate'),
('أخضر', 'Green', 'Akhdar', 'shopping', 'intermediate'),
('أبيض', 'White', 'Abyad', 'shopping', 'intermediate'),
('أسود', 'Black', 'Aswad', 'shopping', 'intermediate'),
('هل يمكن التفاوض؟', 'Can I negotiate?', 'Hal yumkin at-tafawud?', 'shopping', 'advanced'),
('إيصال', 'Receipt', 'Isal', 'shopping', 'intermediate'),
('ضمان', 'Warranty', 'Daman', 'shopping', 'advanced'),
('مقاس', 'Size', 'Maqas', 'shopping', 'intermediate'),

-- Emergency & Health (20 phrases)
('مساعدة!', 'Help!', 'Musa''ada!', 'emergency', 'beginner'),
('طوارئ', 'Emergency', 'Tawari''', 'emergency', 'beginner'),
('طبيب', 'Doctor', 'Tabib', 'emergency', 'beginner'),
('مريض', 'Sick', 'Marid', 'emergency', 'beginner'),
('ألم', 'Pain', 'Alam', 'emergency', 'intermediate'),
('دواء', 'Medicine', 'Dawa''', 'emergency', 'intermediate'),
('حادث', 'Accident', 'Hadith', 'emergency', 'intermediate'),
('شرطة', 'Police', 'Shurta', 'emergency', 'beginner'),
('إسعاف', 'Ambulance', 'Is''af', 'emergency', 'beginner'),
('حريق', 'Fire', 'Hariq', 'emergency', 'intermediate'),
('خطر', 'Danger', 'Khatar', 'emergency', 'intermediate'),
('آمن', 'Safe', 'Amin', 'emergency', 'intermediate'),
('حساسية', 'Allergy', 'Hasasiyya', 'emergency', 'advanced'),
('ضغط الدم', 'Blood pressure', 'Daght ad-dam', 'emergency', 'advanced'),
('سكري', 'Diabetes', 'Sukkari', 'emergency', 'advanced'),
('صداع', 'Headache', 'Suda''', 'emergency', 'intermediate'),
('حمى', 'Fever', 'Humma', 'emergency', 'intermediate'),
('سعال', 'Cough', 'Su''al', 'emergency', 'intermediate'),
('أحتاج طبيب', 'I need a doctor', 'Ahtaj tabib', 'emergency', 'intermediate'),
('أين أقرب مستشفى؟', 'Where is the nearest hospital?', 'Ayna aqrab mustashfa?', 'emergency', 'intermediate'),

-- Transportation (25 phrases)
('سيارة', 'Car', 'Sayyara', 'transport', 'beginner'),
('تاكسي', 'Taxi', 'Taksi', 'transport', 'beginner'),
('حافلة', 'Bus', 'Hafila', 'transport', 'beginner'),
('مترو', 'Metro', 'Metro', 'transport', 'beginner'),
('طائرة', 'Airplane', 'Ta''ira', 'transport', 'intermediate'),
('قطار', 'Train', 'Qitar', 'transport', 'intermediate'),
('دراجة', 'Bicycle', 'Darraja', 'transport', 'intermediate'),
('مشي', 'Walking', 'Mashi', 'transport', 'beginner'),
('سائق', 'Driver', 'Sa''iq', 'transport', 'intermediate'),
('رخصة', 'License', 'Rukhsa', 'transport', 'intermediate'),
('بنزين', 'Petrol', 'Benzin', 'transport', 'intermediate'),
('محطة بنزين', 'Gas station', 'Mahattat benzin', 'transport', 'intermediate'),
('إشارة', 'Traffic light', 'Ishara', 'transport', 'intermediate'),
('دوار', 'Roundabout', 'Dawwar', 'transport', 'intermediate'),
('جسر', 'Bridge', 'Jisr', 'transport', 'intermediate'),
('نفق', 'Tunnel', 'Nafaq', 'transport', 'advanced'),
('موقف', 'Stop', 'Mawqif', 'transport', 'intermediate'),
('تذكرة', 'Ticket', 'Tadhkara', 'transport', 'intermediate'),
('رحلة', 'Trip', 'Rihla', 'transport', 'intermediate'),
('وصول', 'Arrival', 'Wusul', 'transport', 'intermediate'),
('مغادرة', 'Departure', 'Mughadara', 'transport', 'intermediate'),
('تأخير', 'Delay', 'Ta''khir', 'transport', 'advanced'),
('إلغاء', 'Cancellation', 'Ilgha''', 'transport', 'advanced'),
('حجز', 'Booking', 'Hajz', 'transport', 'intermediate'),
('كم المسافة؟', 'How far?', 'Kam al-masafa?', 'transport', 'intermediate'),

-- Business & Work (25 phrases)
('عمل', 'Work', 'Amal', 'business', 'beginner'),
('مكتب', 'Office', 'Maktab', 'business', 'beginner'),
('شركة', 'Company', 'Sharika', 'business', 'intermediate'),
('مدير', 'Manager', 'Mudir', 'business', 'intermediate'),
('موظف', 'Employee', 'Muwazzaf', 'business', 'intermediate'),
('اجتماع', 'Meeting', 'Ijtima''', 'business', 'intermediate'),
('عقد', 'Contract', 'Aqd', 'business', 'advanced'),
('راتب', 'Salary', 'Ratib', 'business', 'intermediate'),
('وظيفة', 'Job', 'Wazifa', 'business', 'intermediate'),
('مقابلة', 'Interview', 'Muqabala', 'business', 'intermediate'),
('مشروع', 'Project', 'Mashru''', 'business', 'intermediate'),
('عميل', 'Client', 'Amil', 'business', 'intermediate'),
('صفقة', 'Deal', 'Safqa', 'business', 'advanced'),
('استثمار', 'Investment', 'Istithmar', 'business', 'advanced'),
('ربح', 'Profit', 'Ribh', 'business', 'intermediate'),
('خسارة', 'Loss', 'Khasara', 'business', 'intermediate'),
('ميزانية', 'Budget', 'Mizaniyya', 'business', 'advanced'),
('تقرير', 'Report', 'Taqrir', 'business', 'intermediate'),
('بريد إلكتروني', 'Email', 'Barid iliktruni', 'business', 'intermediate'),
('هاتف', 'Phone', 'Hatif', 'business', 'beginner'),
('موعد', 'Appointment', 'Maw''id', 'business', 'intermediate'),
('مشغول', 'Busy', 'Mashghul', 'business', 'intermediate'),
('متاح', 'Available', 'Mutah', 'business', 'intermediate'),
('عطلة', 'Holiday', 'Utla', 'business', 'intermediate'),
('إجازة', 'Vacation', 'Ijaza', 'business', 'intermediate'),

-- Family & Relationships (20 phrases)
('عائلة', 'Family', 'A''ila', 'family', 'beginner'),
('أب', 'Father', 'Ab', 'family', 'beginner'),
('أم', 'Mother', 'Umm', 'family', 'beginner'),
('ابن', 'Son', 'Ibn', 'family', 'beginner'),
('بنت', 'Daughter', 'Bint', 'family', 'beginner'),
('أخ', 'Brother', 'Akh', 'family', 'beginner'),
('أخت', 'Sister', 'Ukht', 'family', 'beginner'),
('زوج', 'Husband', 'Zawj', 'family', 'intermediate'),
('زوجة', 'Wife', 'Zawja', 'family', 'intermediate'),
('جد', 'Grandfather', 'Jadd', 'family', 'intermediate'),
('جدة', 'Grandmother', 'Jadda', 'family', 'intermediate'),
('عم', 'Uncle (paternal)', 'Amm', 'family', 'intermediate'),
('خال', 'Uncle (maternal)', 'Khal', 'family', 'intermediate'),
('صديق', 'Friend', 'Sadiq', 'family', 'beginner'),
('جار', 'Neighbor', 'Jar', 'family', 'intermediate'),
('طفل', 'Child', 'Tifl', 'family', 'beginner'),
('شاب', 'Young man', 'Shab', 'family', 'intermediate'),
('رجل', 'Man', 'Rajul', 'family', 'beginner'),
('امرأة', 'Woman', 'Imra''a', 'family', 'beginner'),
('حب', 'Love', 'Hubb', 'family', 'intermediate'),

-- Weather & Environment (20 phrases)
('طقس', 'Weather', 'Taqs', 'weather', 'beginner'),
('شمس', 'Sun', 'Shams', 'weather', 'beginner'),
('مطر', 'Rain', 'Matar', 'weather', 'beginner'),
('رياح', 'Wind', 'Riyah', 'weather', 'intermediate'),
('غيوم', 'Clouds', 'Ghuyum', 'weather', 'intermediate'),
('حار', 'Hot', 'Har', 'weather', 'beginner'),
('بارد', 'Cold', 'Barid', 'weather', 'beginner'),
('دافئ', 'Warm', 'Dafi''', 'weather', 'intermediate'),
('رطب', 'Humid', 'Ratib', 'weather', 'intermediate'),
('جاف', 'Dry', 'Jaf', 'weather', 'intermediate'),
('عاصفة', 'Storm', 'Asifa', 'weather', 'intermediate'),
('ضباب', 'Fog', 'Dabab', 'weather', 'advanced'),
('صيف', 'Summer', 'Sayf', 'weather', 'beginner'),
('شتاء', 'Winter', 'Shita''', 'weather', 'beginner'),
('ربيع', 'Spring', 'Rabi''', 'weather', 'intermediate'),
('خريف', 'Autumn', 'Kharif', 'weather', 'intermediate'),
('درجة حرارة', 'Temperature', 'Darajat harara', 'weather', 'advanced'),
('مناخ', 'Climate', 'Munakh', 'weather', 'advanced'),
('صحراء', 'Desert', 'Sahra''', 'weather', 'intermediate'),
('بحر', 'Sea', 'Bahr', 'weather', 'beginner'),

-- Common Expressions & Idioms (30 phrases)
('يالله', 'Let''s go', 'Yalla', 'expressions', 'beginner'),
('خلاص', 'Finished/Enough', 'Khalas', 'expressions', 'beginner'),
('ماشي', 'OK/Alright', 'Mashi', 'expressions', 'beginner'),
('والله', 'By God/Really', 'Wallah', 'expressions', 'intermediate'),
('طيب', 'Good/OK', 'Tayyib', 'expressions', 'beginner'),
('ممكن', 'Possible/Can', 'Mumkin', 'expressions', 'beginner'),
('مستحيل', 'Impossible', 'Mustahil', 'expressions', 'intermediate'),
('مبروك', 'Congratulations', 'Mabrook', 'expressions', 'beginner'),
('الله يعطيك العافية', 'God give you strength', 'Allah ya''tik al-afiya', 'expressions', 'intermediate'),
('تسلم', 'Thank you (lit. may you be safe)', 'Tislam', 'expressions', 'intermediate'),
('الله يسلمك', 'God keep you safe', 'Allah yisallimak', 'expressions', 'intermediate'),
('بالهناء والشفاء', 'Bon appetit', 'Bil-hana wa ash-shifa', 'expressions', 'advanced'),
('صحة وعافية', 'To your health', 'Sahha wa afiya', 'expressions', 'intermediate'),
('حمدلله', 'Thank God', 'Hamdulillah', 'expressions', 'beginner'),
('استغفر الله', 'I seek forgiveness from God', 'Astaghfirullah', 'expressions', 'intermediate'),
('بسم الله', 'In the name of God', 'Bismillah', 'expressions', 'beginner'),
('لا حول ولا قوة إلا بالله', 'There is no power except with God', 'La hawla wa la quwwata illa billah', 'expressions', 'advanced'),
('يا سلام', 'How wonderful', 'Ya salam', 'expressions', 'intermediate'),
('شو هذا؟', 'What is this?', 'Shu hatha?', 'expressions', 'beginner'),
('ليش؟', 'Why?', 'Laysh?', 'expressions', 'beginner'),
('وين؟', 'Where?', 'Wayn?', 'expressions', 'beginner'),
('متى؟', 'When?', 'Mata?', 'expressions', 'beginner'),
('كيف؟', 'How?', 'Kayf?', 'expressions', 'beginner'),
('مين؟', 'Who?', 'Min?', 'expressions', 'beginner'),
('شكراً جزيلاً', 'Thank you very much', 'Shukran jazilan', 'expressions', 'intermediate'),
('لا شكر على واجب', 'No thanks necessary', 'La shukr ala wajib', 'expressions', 'advanced'),
('تكرم', 'You''re welcome (formal)', 'Takram', 'expressions', 'advanced'),
('أعتذر', 'I apologize', 'A''tadhir', 'expressions', 'intermediate'),
('سامحني', 'Forgive me', 'Samihni', 'expressions', 'intermediate'),
('حياك الله', 'God give you life (welcome)', 'Hayyak Allah', 'expressions', 'advanced');

-- Create function to get daily Arabic phrase
CREATE OR REPLACE FUNCTION get_daily_arabic_phrase(for_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    id UUID,
    arabic_text TEXT,
    english_text TEXT,
    pronunciation TEXT,
    category TEXT,
    difficulty TEXT
) AS $$
BEGIN
    -- First check if we have a specific phrase for this date
    RETURN QUERY
    SELECT 
        ap.id,
        ap.arabic_text,
        ap.english_text,
        ap.pronunciation,
        ap.category,
        ap.difficulty
    FROM public.daily_arabic_phrase dap
    JOIN public.arabic_phrases ap ON ap.id = dap.phrase_id
    WHERE dap.display_date = for_date
    LIMIT 1;

    -- If no specific phrase for this date, get a random one based on date seed
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            ap.id,
            ap.arabic_text,
            ap.english_text,
            ap.pronunciation,
            ap.category,
            ap.difficulty
        FROM public.arabic_phrases ap
        WHERE ap.is_active = true
        ORDER BY md5(for_date::text || ap.id::text)
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;