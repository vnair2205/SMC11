import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import logo from '../assets/seekmycourse_logo.png';
import Preloader from '../components/common/Preloader';

// --- Styled Components ---
const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const VerificationBox = styled.div`
  width: 400px;
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

const EmailInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
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

const VerifyEmailPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    // Ensure email is correctly retrieved from state, falling back if not present
    const { email: initialEmail } = location.state || {}; 

    const [otp, setOtp] = useState('');
    const [currentEmail, setCurrentEmail] = useState(initialEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
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
        return () => clearInterval(intervalId);
    };

    useEffect(() => {
        if (!initialEmail) {
            // If initialEmail is not available, redirect to signup to restart flow
            navigate('/signup');
            return;
        }
        // Start timer only if initialEmail is available
        const cleanupTimer = startTimer(); 
        return cleanupTimer;
    }, [initialEmail, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setNotification({ type: '', text: '' });
        try {
            const res = await axios.post('/api/auth/verify-email', { email: currentEmail, otp });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.generic') });
            setIsLoading(false);
        }
    };

    const handleChangeEmailSubmit = async (e) => {
        e.preventDefault();
        setNotification({ type: '', text: '' });
        if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
            return setNotification({ type: 'error', text: t('errors.enter_valid_email') });
        }
        setIsLoading(true);
        try {
            // Ensure `oldEmail` is passed for the update endpoint
            await axios.post('/api/auth/update-email', { oldEmail: currentEmail, newEmail });
            setNotification({ type: 'success', text: t('email_update_success') });
            setCurrentEmail(newEmail); // Update current email state
            setIsChangingEmail(false);
            setNewEmail(''); // Clear new email input
            startTimer(); // Restart timer for the new email OTP
        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.email_update_failed') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setNotification({ type: '', text: '' });
        try {
            // Use currentEmail to resend OTP
            await axios.post('/api/auth/resend-email-otp', { email: currentEmail });
            setNotification({ type: 'success', text: t('email_otp_resent_success') });
            startTimer(); // Restart the timer
        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.otp_failed_resend') });
        }
    };

    if (isChangingEmail) {
        return (
            <PageContainer>
                {isLoading && <Preloader />}
                <VerificationBox as="form" onSubmit={handleChangeEmailSubmit}>
                    <Logo src={logo} alt="Logo" />
                    <Title>{t('change_email_title')}</Title>
                    <Subtitle>{t('change_email_subtitle')}</Subtitle>
                    {notification.text && <NotificationText type={notification.type}>{notification.text}</NotificationText>}
                    <EmailInput 
                        type="email"
                        placeholder={t('email_placeholder')}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                    />
                    <VerifyButton type="submit" style={{marginBottom: '1rem'}}>{t('save_and_resend_button')}</VerifyButton>
                    <ChangeLink onClick={() => {
                        setIsChangingEmail(false);
                        setNotification({ type: '', text: '' }); // Clear notification on cancel
                    }}>{t('errors.cancel_button')}</ChangeLink>
                </VerificationBox>
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            {isLoading && <Preloader />}
            <VerificationBox>
                <Logo src={logo} alt="Logo" />
                <Title>{t('verify_email_title')}</Title>
                {notification.text && <NotificationText type={notification.type}>{notification.text}</NotificationText>}
                <Subtitle>
                    {t('verify_email_intro')}
                    <br />
                    <span>{currentEmail}</span>
                </Subtitle>
                <ChangeLink onClick={() => {
                    setIsChangingEmail(true);
                    setNotification({ type: '', text: '' }); // Clear notification when changing email
                }}>{t('change_email_link')}</ChangeLink>
                <form onSubmit={handleSubmit} style={{width: '100%'}}>
                    <OtpInput 
                        type="text" 
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                    <VerifyButton type="submit">{t('complete_reg_button')}</VerifyButton>
                </form>
                 <ResendText>
                    {t('spam_prompt')}{' '}
                    <button onClick={handleResend} disabled={!canResend}>
                        {canResend ? t('resend_button') : t('resend_timer', { seconds: timer })}
                    </button>
                </ResendText>
            </VerificationBox>
        </PageContainer>
    );
};

export default VerifyEmailPage;