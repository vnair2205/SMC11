// client/src/pages/dashboard/CertificatePage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas'; 
import { jsPDF } from 'jspdf';
import Preloader from '../../components/common/Preloader';
import certificateBg from '../../assets/SMC-Certificate.jpg';
import { FiDownload, FiX } from 'react-icons/fi';

const PageContainer = styled.div`
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative; 
  overflow-y: auto; 
`;

const CertificateWrapper = styled.div`
  width: 595px; /* Standard A4 width at 72 DPI */
  height: 842px; /* Standard A4 height at 72 DPI */
  position: relative;
  background-image: url(${certificateBg});
  background-size: 100% 100%;
  font-family: 'Calisto MT', serif; 
  color: #1e1e2d;
`;


// Each element is positioned precisely
const UserName = styled.h1`
    position: absolute;
    top: 504px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 32px;
    font-weight: bold;
    margin: 0;
`;

const CourseName = styled.p`
    position: absolute;
    top: 582px;
    left: 0;
    width: 100%;
    padding: 0 60px;
    box-sizing: border-box;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    line-height: 1.4;
    margin: 0;
`;

const CompletionDate = styled.p`
    position: absolute;
    bottom: 50px;
    left: 22px; 
    width: 150px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
`;

const QrCodeContainer = styled.div`
    position: absolute;
    bottom: 50px;
    left: 49%;
    transform: translateX(-50%);
    background-color: white;
    padding: 5px;
    border: 1px solid #ccc;
`;

const BottomActionsContainer = styled.div`
  margin-top: 2rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  gap: 1.5rem; 
  width: 100%;
  max-width: 500px; 
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold; 
  cursor: pointer;
  white-space: nowrap; 
  background-color: ${({ theme, primary }) => (primary ? theme.colors.primary : '#555')};
  color: ${({ theme, primary }) => (primary ? theme.colors.background : 'white')};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme, primary }) => (primary ? '#03a092' : '#777')}; 
  }
`;

const CertificatePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef();

    // The verification URL for the QR code should point to the public verification endpoint
    // It uses window.location.origin to adapt to localhost or deployed domain.
    const verificationUrl = `${window.location.origin}/verify/${courseId}/${user?.id}`;

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            try {
                const courseRes = await axios.get(`/api/course/${courseId}`, config);
                const userRes = await axios.get('/api/dashboard', config);
                
                setCourse(courseRes.data);
                setUser(userRes.data.user);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Redirect to dashboard or login if data fetch fails
                navigate('/dashboard'); 
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId, navigate]);

    const formatName = (firstName, lastName) => {
        const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');
        return `${capitalize(firstName)} ${capitalize(lastName)}`;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleDownload = () => {
        if (!certificateRef.current) return;
        html2canvas(certificateRef.current, {
            scale: 6, 
            useCORS: true,
            backgroundColor: null
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px', 
                format: 'a4' 
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight); 
            const sanitizedTopic = course.topic.replace(/[^a-zA-Z0-9]/g, '_');
            pdf.save(`SeekMYCOURSE-Certificate-${sanitizedTopic}.pdf`);
        });
    };

    if (loading) return <Preloader />;

    return (
        <PageContainer>
            <CertificateWrapper ref={certificateRef}>
                <UserName>{user ? formatName(user.firstName, user.lastName) : 'Your Name'}</UserName>
                <CourseName>{course ? course.topic.toUpperCase() : 'YOUR COURSE TOPIC'}</CourseName>
                <CompletionDate>{formatDate(new Date())}</CompletionDate>
                <QrCodeContainer>
                    <QRCodeSVG
                        value={verificationUrl}
                        size={80}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="L"
                    />
                </QrCodeContainer>
            </CertificateWrapper>

            <BottomActionsContainer>
                <ActionButton primary onClick={handleDownload}>
                    <FiDownload /> Download Certificate
                </ActionButton>
                <ActionButton onClick={() => navigate(`/course/${courseId}`)}>
                    <FiX /> Close Certificate
                </ActionButton>
            </BottomActionsContainer>
        </PageContainer>
    );
};

export default CertificatePage;