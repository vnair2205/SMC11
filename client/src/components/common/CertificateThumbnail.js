import React from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import certificateBg from '../../assets/SMC-Certificate.jpg';

// Wrapper to scale the certificate down to thumbnail size
const ThumbnailWrapper = styled.div`
  width: 595px; /* A4 width */
  height: 842px; /* A4 height */
  position: relative;
  overflow: hidden;
  transform: scale(${280 / 595}); /* Scale down to fit 280px card width */
  transform-origin: top left; /* Revert this to top left for correct positioning inside the flex container */
`;

const CertificateContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-image: url(${certificateBg});
  background-size: 100% 100%;
  font-family: 'Calisto MT', serif; 
  color: #1e1e2d;
`;

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

const CertificateThumbnail = ({ course, user }) => {
    const verificationUrl = `${window.location.origin}/verify/${course._id}/${user?.id}`;

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

    return (
        <ThumbnailWrapper>
            <CertificateContainer>
                <UserName>{user ? formatName(user.firstName, user.lastName) : ' '}</UserName>
                <CourseName>{course ? (course.englishTopic || course.topic).toUpperCase() : ' '}</CourseName>
                <CompletionDate>{formatDate(course.completionDate || new Date())}</CompletionDate>
                <QrCodeContainer>
                    <QRCodeSVG value={verificationUrl} size={80} bgColor="#ffffff" fgColor="#000000" level="L" />
                </QrCodeContainer>
            </CertificateContainer>
        </ThumbnailWrapper>
    );
};

export default CertificateThumbnail;