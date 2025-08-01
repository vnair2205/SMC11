import React, { useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import logo from '../assets/seekmycourse_logo.png';
import Preloader from '../components/common/Preloader';
import { FiEye, FiEyeOff } from 'react-icons/fi';

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
  width: 180px;
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

const PasswordIcon = styled.div`
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const NotificationText = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  width: 100%;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: ${({ type, theme }) => (type === 'error' ? '#581b1b' : '#03453f')};
  color: ${({ type, theme }) => (type === 'error' ? theme.colors.error : theme.colors.primary)};
  border: 1px solid ${({ type, theme }) => (type === 'error' ? theme.colors.error : theme.colors.primary)};
  box-sizing: border-box;
`;

// --- Component ---
const ResetPasswordPage = () => {
    const { t } = useTranslation();
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ type: '', text: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotification({ type: '', text: '' });

        if (password.length < 6) {
            return setNotification({ type: 'error', text: t('errors.password_min_length') });
        }
        if (password !== confirmPassword) {
            return setNotification({ type: 'error', text: t('errors.passwords_no_match') });
        }
        
        setIsLoading(true);
        
        try {
            await axios.post(`/api/auth/reset-password/${token}`, { password });
            setNotification({ type: 'success', text: t('password_updated_success') });
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setNotification({ type: 'error', text: t(err.response?.data?.msgKey || 'errors.generic') });
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            {isLoading && <Preloader />}
            <FormBox>
                <Logo src={logo} alt="Logo" />
                <Title>{t('reset_password_title')}</Title>
                <Subtitle>{t('reset_password_subtitle')}</Subtitle>
                {notification.text && <NotificationText type={notification.type}>{notification.text}</NotificationText>}
                
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <InputGroup>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('new_password_placeholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <PasswordIcon onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </PasswordIcon>
                    </InputGroup>
                    <InputGroup>
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={t('confirm_password_placeholder')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <PasswordIcon onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </PasswordIcon>
                    </InputGroup>
                    <SubmitButton type="submit">{t('update_password_button')}</SubmitButton>
                </form>
            </FormBox>
        </PageContainer>
    );
};

export default ResetPasswordPage;