import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import Preloader from '../../components/common/Preloader';
import CertificateThumbnail from '../../components/common/CertificateThumbnail'; 

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  color: white;
  margin-bottom: 2rem;
`;

const CertificateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  flex-grow: 1;
`;

const CertificateCard = styled.div`
  background-color: #1e1e2d;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
`;

// --- FIX: Ensure there is only ONE CardThumbnail definition ---
const CardThumbnail = styled.div`
  width: 100%;
  height: 400px; /* Height to match the scaled certificate */
  overflow: hidden;
  border-bottom: 3px solid ${({ theme }) => theme.colors.primary};
   justify-content: center;
  align-items: center;
`;

const CardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.75rem;
`;

const CardDetail = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.4rem;
  span {
    font-weight: bold;
    color: white;
  }
`;

const CardButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
`;

const NoCertificatesMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 3rem;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MyCertificatesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const config = { headers: { 'x-auth-token': token } };
      
      const [userResponse, certResponse] = await Promise.all([
        axios.get('/api/dashboard', config),
        axios.get('/api/course/', {
          ...config,
          params: {
            certified: true,
            limit: 100
          },
        })
      ]);
      
      setUser(userResponse.data.user);
      setCertificates(certResponse.data.docs);

    } catch (err) {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (loading || !user) {
    return <Preloader />;
  }

  return (
    <PageContainer>
      <HeaderTitle>{t('my_certificates_page.title', { defaultValue: 'My Certificates' })}</HeaderTitle>
      
      {error && <NoCertificatesMessage style={{color: 'red'}}>{error}</NoCertificatesMessage>}

      {certificates.length === 0 && !error ? (
        <NoCertificatesMessage>{t('my_certificates_page.no_certificates')}</NoCertificatesMessage>
      ) : (
        <CertificateGrid>
          {certificates.map((course) => (
            <CertificateCard key={course._id}>
              <CardThumbnail>
                <CertificateThumbnail course={course} user={user} />
              </CardThumbnail>
              <CardContent>
                <CardTitle title={course.englishTopic || course.topic}>{course.englishTopic || course.topic}</CardTitle>
                <CardDetail>{t('sidebar.created_on')}: <span>{format(new Date(course.createdAt), 'dd/MM/yyyy')}</span></CardDetail>
                <CardDetail>{t('sidebar.course_completion_date')}: <span>{format(new Date(course.completionDate), 'dd/MM/yyyy')}</span></CardDetail>
                <CardDetail>
                    {t('score_card.score_label')}: <span>{((course.score / course.quiz.length) * 100).toFixed(0)}%</span>
                </CardDetail>
                <CardButton onClick={() => navigate(`/course/${course._id}/certificate`)}>
                    {t('my_certificates_page.view_certificate_button')}
                </CardButton>
              </CardContent>
            </CertificateCard>
          ))}
        </CertificateGrid>
      )}
    </PageContainer>
  );
};

export default MyCertificatesPage;