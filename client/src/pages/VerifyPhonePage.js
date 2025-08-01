import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import logo from '../assets/seekmycourse_logo.png';
import Preloader from '../components/common/Preloader';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// --- Styled Components ---
const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const VerificationBox = styled.div`
  width: 450px;
  padding: 3rem;
  background-color: #33333d;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Logo = styled.img`
  width: 150px;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  span {
    color: ${({ theme }) => theme.colors.white};
    font-weight: bold;
  }
`;

const OtpInput = styled.input`
  width: 200px;
  padding: 1rem;
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const VerifyButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
`;

const ResendText = styled.p`
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0;
    &:disabled {
      color: ${({ theme }) => theme.colors.textSecondary};
      cursor: not-allowed;
    }
  }
`;

const ChangeLink = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 0;
    &:hover {
        text-decoration: underline;
    }
`;

const PhoneInputWrapper = styled.div`
    width: 100%;
    margin-bottom: 1rem;
    .PhoneInput {
        --react-phone-number-input-height: 48px;
        .PhoneInputInput {
            height: var(--react-phone-number-input-height);
            padding: 0.9rem;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            color: #333;
            box-sizing: border-box;
            &:focus {
                outline: none;
                border-color: ${({ theme }) => theme.colors.primary};
            }
        }
        .PhoneInputCountry {
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-right: none;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
            height: var(--react-phone-number-input-height);
            display: flex;
            align-items: center;
            box-sizing: border-box;
            min-width: 95px;
            padding: 0 1rem;
        }
        .PhoneInputCountrySelectArrow {
            opacity: 1;
            color: #333;
        }
    }
`;

const NotificationText = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  width: 100%;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: ${({ type }) => (type === 'error' ? '#581b1b' : '#03453f')};
  color: ${({ type, theme }) => (type === 'error' ? theme.colors.error : theme.colors.primary)};
  border: 1px solid ${({ type, theme }) => (type === 'error' ? theme.colors.error : theme.colors.primary)};
  box-sizing: border-box;
`;

const VerifyPhonePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { email, phone: initialPhone } = location.state || {};

    const [otp, setOtp] = useState('');
    const [currentPhone, setCurrentPhone] = useState(initialPhone);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingNumber, setIsChangingNumber] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [notification, setNotification] = useState({ type: '', text: '' });

    const startTimer = () => {
        setCanResend(false);
        setTimer(30);
        const intervalId = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return intervalId;
    };

    useEffect(() => {
        if (!email) { 
            navigate('/signup'); 
            return;
        }
        const timerId = startTimer();
        return () => clearInterval(timerId);
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setNotification({ type: '', text: '' });
        try {
            await axios.post('/api/auth/verify-phone', { email, otp });
            navigate('/verify-email', { state: { email } });
        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.generic')});
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setNotification({ type: '', text: '' });
        try {
            const res = await axios.post('/api/auth/resend-phone-otp', { email });
            setNotification({ type: 'success', text: t(res.data.msg || 'phone_otp_resent_success') });
            startTimer();
        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.otp_failed_resend') });
        }
    };

    const handleChangeNumberSubmit = async (e) => {
        e.preventDefault();
        setNotification({ type: '', text: '' });
        if (!newPhoneNumber) {
            return setNotification({ type: 'error', text: t('errors.enter_new_phone') });
        }
        setIsLoading(true);
        try {
            await axios.post('/api/auth/update-phone', { email, newPhoneNumber });
            setNotification({ type: 'success', text: t('phone_update_success') });
            setCurrentPhone(newPhoneNumber);
            setIsChangingNumber(false);
            setNewPhoneNumber('');
            startTimer();
        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.phone_update_failed') });
        } finally {
            setIsLoading(false);
        }
    };

    if (isChangingNumber) {
        return (
            <PageContainer>
                {isLoading && <Preloader />}
                <VerificationBox as="form" onSubmit={handleChangeNumberSubmit}>
                    <Logo src={logo} alt="Logo" />
                    <Title>{t('change_phone_title')}</Title>
                    <Subtitle>{t('change_phone_subtitle')}</Subtitle>
                    {notification.text && <NotificationText type={notification.type}>{notification.text}</NotificationText>}
                    <PhoneInputWrapper>
                        <PhoneInput 
                            placeholder={t('phone_number')} 
                            value={newPhoneNumber} 
                            onChange={setNewPhoneNumber} 
                            defaultCountry="IN" 
                            international 
                        />
                    </PhoneInputWrapper>
                    <VerifyButton type="submit" style={{marginBottom: '1rem'}}>{t('save_and_resend_button')}</VerifyButton>
                    <ChangeLink onClick={() => setIsChangingNumber(false)}>{t('errors.cancel_button')}</ChangeLink>
                </VerificationBox>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {isLoading && <Preloader />}
            <VerificationBox>
                <Logo src={logo} alt="Logo" />
                <Title>{t('verify_phone_title')}</Title>
                {notification.text && <NotificationText type={notification.type}>{notification.text}</NotificationText>}
                <Subtitle>
                    {t('verify_phone_intro')}
                    <br /> 
                    <span>{currentPhone}</span>
                </Subtitle>
                <ChangeLink onClick={() => setIsChangingNumber(true)}>{t('change_number_link')}</ChangeLink>
                <form onSubmit={handleSubmit} style={{width: '100%'}}>
                    <OtpInput 
                        type="text" 
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                    <VerifyButton type="submit">{t('verify_button')}</VerifyButton>
                </form>
                <ResendText>
                    {t('resend_prompt')}{' '}
                    <button onClick={handleResend} disabled={!canResend}>
                        {canResend ? t('resend_button') : t('resend_timer', { seconds: timer })}
                    </button>
                </ResendText>
            </VerificationBox>
        </PageContainer>
    );
};

export default VerifyPhonePage;