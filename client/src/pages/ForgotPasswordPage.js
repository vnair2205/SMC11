import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
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

const FormBox = styled.div`
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
  margin-bottom: 2rem;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0.9rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
`;

const SubmitButton = styled.button`
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

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.75rem;
  position: absolute;
  top: -1.2rem;
  left: 0.2rem;
`;

const BackToLogin = styled(Link)`
  margin-top: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.9rem;
`;

// --- Component ---
const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const checkRes = await axios.post('/api/auth/check-email', { email });
            if (!checkRes.data.exists) {
                setError(t('errors.email_not_registered'));
                setIsLoading(false);
                return;
            }

            await axios.post('/api/auth/forgot-password', { email });
            setIsSubmitted(true);
            startTimer();
        } catch (err) {
            // This debug line will print the full error to your browser's console
            console.error("DEBUG: Full error response from server:", err.response);
            setError(t(err.response?.data?.msgKey || 'errors.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setIsLoading(true);
        try {
            await axios.post('/api/auth/forgot-password', { email });
            startTimer();
        } catch (err) {
            console.error("DEBUG: Full error response from server on resend:", err.response);
            setError(t(err.response?.data?.msgKey || 'errors.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            {isLoading && <Preloader />}
            <FormBox>
                <Logo src={logo} alt="Logo" />
                {!isSubmitted ? (
                    <>
                        <Title>{t('forgot_password_title')}</Title>
                        <Subtitle>{t('forgot_password_subtitle')}</Subtitle>
                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <InputGroup>
                                {error && <ErrorText>{error}</ErrorText>}
                                <Input
                                    type="email"
                                    placeholder={t('email_placeholder')}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    required
                                />
                            </InputGroup>
                            <SubmitButton type="submit">{t('submit_button')}</SubmitButton>
                        </form>
                    </>
                ) : (
                    <>
                        <Title>{t('reset_link_sent')}</Title>
                        <Subtitle>Please check your inbox (and spam folder) for the reset link.</Subtitle>
                        <ResendText>
                            {t('resend_prompt')}{' '}
                            <button onClick={handleResend} disabled={!canResend}>
                                {canResend ? t('resend_button') : t('resend_timer', { seconds: timer })}
                            </button>
                        </ResendText>
                    </>
                )}
                 <BackToLogin to="/login">Back to Login</BackToLogin>
            </FormBox>
        </PageContainer>
    );
};

export default ForgotPasswordPage;