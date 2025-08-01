import React, { useState, forwardRef } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import axios from 'axios';
import { FiEye, FiEyeOff, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import logo from '../assets/seekmycourse_logo.png';
import signupBanner from '../assets/SMC_Signup_Banner.png';
import Preloader from '../components/common/Preloader';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../components/common/Modal';

// --- Styled Components ---
const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
`;

const FormContainer = styled.div`
  width: 35%;
  padding: 2rem 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background};
  overflow-y: auto;
  @media (max-width: 992px) {
    width: 50%;
  }
  @media (max-width: 768px) {
    width: 100%;
    padding: 2rem;
  }
`;

const BannerContainer = styled.div`
  width: 65%;
  background-image: url(${signupBanner});
  background-size: cover;
  background-position: center;
  @media (max-width: 992px) {
    width: 50%;
  }
  @media (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.img`
  width: 180px;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1rem;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  width: 100%;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0.9rem;
  padding-right: ${({ hasIcon }) => (hasIcon ? '3rem' : '0.9rem')};
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  box-sizing: border-box;
  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Icon = styled.div`
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  z-index: 10;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Checkbox = styled.input`
  margin-right: 0.75rem;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  a {
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SignUpButton = styled.button`
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
`;

const SignInText = styled.p`
  margin-top: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.75rem;
  position: absolute;
  top: -1.2rem;
  left: 0.2rem;
`;

const CheckboxErrorText = styled(ErrorText)`
    position: static;
    text-align: left;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
`;

const DatePickerWrapper = styled.div`
  width: 100%;
  .react-datepicker-wrapper,
  .react-datepicker__input-container,
  .react-datepicker__input-container input {
    width: 100%;
    height: 48px;
    display: block;
  }
`;

const PhoneInputWrapper = styled.div`
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

const DatePickerCustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <Input
    onClick={onClick}
    ref={ref}
    value={value}
    placeholder={placeholder}
    readOnly
    hasIcon
  />
));

const SignupPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        reenterPassword: '',
        agreed: false,
    });
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showReenterPassword, setShowReenterPassword] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalErrorMessage, setModalErrorMessage] = useState('');
    
    const { firstName, lastName, email, password, reenterPassword, agreed } = formData;

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newFormData = { ...formData };
        newFormData[name] = type === 'checkbox' ? checked : value;
        setFormData(newFormData);
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }
    };

    const handleEmailBlur = async () => {
        if (email && !errors.email) {
            try {
                const res = await axios.post('/api/auth/check-email', { email });
                if (res.data.exists) {
                    setErrors({ ...errors, email: t('errors.email_exists') });
                }
            } catch (err) {
                console.error('Could not verify email.');
            }
        }
    };

    const handlePhoneBlur = async () => {
        if (phoneNumber && !errors.phoneNumber) {
            try {
                const res = await axios.post('/api/auth/check-phone', { phoneNumber });
                if (res.data.exists) {
                    setErrors({ ...errors, phoneNumber: t('errors.phone_exists') });
                }
            } catch (err) {
                console.error('Could not verify phone number.');
            }
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        if (!firstName.trim()) newErrors.firstName = t('errors.first_name_required');
        else if (!lastName.trim()) newErrors.lastName = t('errors.last_name_required');
        else if (!email.trim()) newErrors.email = t('errors.email_required');
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t('errors.email_invalid');
        else if (!phoneNumber) newErrors.phoneNumber = t('errors.phone_required');
        else if (!dateOfBirth) newErrors.dateOfBirth = t('errors.dob_required');
        else if (!password) newErrors.password = t('errors.password_required');
        else if (password.length < 6) newErrors.password = t('errors.password_min_length');
        else if (password !== reenterPassword) newErrors.reenterPassword = t('errors.passwords_no_match');
        else if (!agreed) newErrors.agreed = t('errors.terms_required');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(errors.email || errors.phoneNumber) {
            const newErrors = {...errors};
            delete newErrors.email;
            delete newErrors.phoneNumber;
            setErrors(newErrors);
        }
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        const finalData = { firstName, lastName, email, password, phoneNumber, dateOfBirth };
        
        try {
            await axios.post('/api/auth/register', finalData);
            navigate('/verify-phone', { state: { email: finalData.email, phone: finalData.phoneNumber } });
        } catch (err) {
            const errorKey = err.response?.data?.msgKey || 'errors.generic';
            const errorContext = err.response?.data?.context || {};
            const translatedError = t(errorKey, errorContext);

            if (errorKey === 'errors.phone_fraudulent') {
                setModalErrorMessage(translatedError);
                setShowErrorModal(true);
            } else {
                setErrors({ ...errors, email: translatedError });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            {isLoading && <Preloader />}

            <Modal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title={t('errors.phone_invalid')}
            >
                <FiAlertTriangle size={40} color="#d95c03" style={{ marginBottom: '1rem' }} />
                <ModalText>{modalErrorMessage}</ModalText>
                <ModalButtonContainer>
                    <ModalButton primary onClick={() => setShowErrorModal(false)}>
                        OK
                    </ModalButton>
                </ModalButtonContainer>
            </Modal>

            <FormContainer>
                <Logo src={logo} alt="SeekMYCOURSE Logo" />
                <Title>{t('create_account')}</Title>
                <Subtitle>{t('start_journey')}</Subtitle>
                <Form onSubmit={handleSubmit}>
                    <LanguageSwitcher variant="form" />
                    <Row>
                        <InputGroup>
                            {errors.firstName && <ErrorText>{errors.firstName}</ErrorText>}
                            <Input type="text" name="firstName" placeholder={t('first_name')} value={firstName} onChange={onChange} />
                        </InputGroup>
                        <InputGroup>
                            {errors.lastName && <ErrorText>{errors.lastName}</ErrorText>}
                            <Input type="text" name="lastName" placeholder={t('last_name')} value={lastName} onChange={onChange} />
                        </InputGroup>
                    </Row>
                    
                    <InputGroup>
                        {errors.email && <ErrorText>{errors.email}</ErrorText>}
                        <Input type="email" name="email" placeholder={t('email_placeholder')} value={email} onChange={onChange} onBlur={handleEmailBlur} />
                    </InputGroup>
                    
                    <InputGroup>
                        {errors.phoneNumber && <ErrorText>{errors.phoneNumber}</ErrorText>}
                        <PhoneInputWrapper>
                            <PhoneInput placeholder={t('phone_number')} value={phoneNumber} onChange={setPhoneNumber} onBlur={handlePhoneBlur} defaultCountry="IN" international />
                        </PhoneInputWrapper>
                    </InputGroup>

                    <InputGroup>
                        {errors.dateOfBirth && <ErrorText>{errors.dateOfBirth}</ErrorText>}
                        <DatePickerWrapper>
                            <DatePicker selected={dateOfBirth} onChange={(date) => setDateOfBirth(date)} dateFormat="dd/MM/yyyy" showYearDropdown showMonthDropdown dropdownMode="select" maxDate={new Date()} placeholderText={t('dob')} customInput={<DatePickerCustomInput />} />
                        </DatePickerWrapper>
                        <Icon><FiCalendar /></Icon>
                    </InputGroup>
                    
                    <InputGroup>
                        {errors.password && <ErrorText>{errors.password}</ErrorText>}
                        <Input type={showPassword ? 'text' : 'password'} name="password" placeholder={t('password_placeholder')} value={password} onChange={onChange} hasIcon />
                        <Icon onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</Icon>
                    </InputGroup>

                    <InputGroup>
                        {errors.reenterPassword && <ErrorText>{errors.reenterPassword}</ErrorText>}
                        <Input type={showReenterPassword ? 'text' : 'password'} name="reenterPassword" placeholder={t('re_enter_password')} value={reenterPassword} onChange={onChange} hasIcon />
                        <Icon onClick={() => setShowReenterPassword(!showReenterPassword)}>{showReenterPassword ? <FiEyeOff /> : <FiEye />}</Icon>
                    </InputGroup>
                    
                    <CheckboxContainer>
                        <Checkbox type="checkbox" name="agreed" checked={agreed} onChange={onChange} />
                        <CheckboxLabel>
                            <Trans i18nKey="agree_terms">
                                I agree to the <a href="/public/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> & <a href="/public/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                            </Trans>
                        </CheckboxLabel>
                    </CheckboxContainer>
                    {errors.agreed && <CheckboxErrorText>{errors.agreed}</CheckboxErrorText>}

                    <SignUpButton type="submit">{t('signup_link')}</SignUpButton>
                </Form>
                
                <SignInText>
                  <Trans i18nKey="log_in_prompt">
                      Already have an account? <Link to="/login">Sign In</Link>
                  </Trans>
                </SignInText>
            </FormContainer>
            <BannerContainer />
        </PageContainer>
    );
};

export default SignupPage;