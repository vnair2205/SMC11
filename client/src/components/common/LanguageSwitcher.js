import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';

// FIX: Add the translated title directly here for a reliable animation
const languages = [
    { code: 'en', name: 'English', title: 'Select your language' },
    { code: 'ar', name: 'العربية', title: 'اختر لغتك' },
    { code: 'bn', name: 'বাংলা', title: 'আপনার ভাষা নির্বাচন করুন' },
    { code: 'gu', name: 'ગુજરાતી', title: 'તમારી ભાષા પસંદ કરો' },
    { code: 'hi', name: 'हिन्दी', title: 'अपनी भाषा चुनें' },
    { code: 'kn', name: 'ಕನ್ನಡ', title: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' },
    { code: 'ml', name: 'മലയാളം', title: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക' },
    { code: 'mr', name: 'मराठी', title: 'तुमची भाषा निवडा' },
    { code: 'ta', name: 'தமிழ்', title: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்' },
    { code: 'te', name: 'తెలుగు', title: 'మీ భాషను ఎంచుకోండి' },
    { code: 'ur', name: 'اردو', title: 'اپنی زبان منتخب کریں' },
];

const SwitcherContainer = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;
`;

const textAnimation = keyframes`
  0%, 100% { opacity: 0; transform: translateY(10px); }
  10%, 90% { opacity: 1; transform: translateY(0); }
`;

const AnimatedTitle = styled.h4`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.75rem;
  font-weight: 500;
  height: 20px;
  text-align: center;
  
  span {
    display: inline-block;
    animation: ${textAnimation} 3s ease-in-out infinite;
  }
`;

const LanguageSelect = styled.select`
  width: 100%;
  height: 48px;
  padding: 0.9rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  background-color: white;
  color: #333;
  font-size: 1rem;
  box-sizing: border-box;
`;

const LanguageSwitcher = ({ variant = 'form' }) => { // Accept a variant prop
    const { i18n } = useTranslation();
    const [animatedText, setAnimatedText] = useState('Select your language');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % languages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // FIX: Simplified effect uses the hardcoded titles from the array
    useEffect(() => {
        setAnimatedText(languages[currentIndex].title);
    }, [currentIndex]);

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <SwitcherContainer>
            {/* Conditionally render the title based on the variant */}
            {variant === 'form' && (
                <AnimatedTitle>
                    <span>{animatedText}</span>
                </AnimatedTitle>
            )}
            <LanguageSelect onChange={changeLanguage} value={i18n.language}>
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </LanguageSelect>
        </SwitcherContainer>
    );
};

export default LanguageSwitcher;