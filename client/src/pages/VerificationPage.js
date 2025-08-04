import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import Preloader from '../components/common/Preloader';
import logo from '../assets/seekmycourse_logo.png';

const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: 100vh;
  padding: 2rem;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
`;

const Logo = styled.img`
  width: 200px;
`;

const ContentWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background-color: #33333d;
  padding: 2rem;
  border-radius: 12px;
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  border-bottom: 1px solid #555;
  padding-bottom: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const DetailLabel = styled.strong`
  color: #a0a0a0;
`;

const FormattedList = styled.ol`
    margin-left: 1.5rem;
    padding-left: 0;
    li {
        margin-bottom: 0.5rem;
        color: white;
    }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`;

const VerificationPage = () => {
    const { courseId, userId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVerificationData = async () => {
            try {
                const res = await axios.get(`/api/course/verify/${courseId}/${userId}`);
                setData(res.data);
            } catch (err) {
                setError("This certificate could not be verified.");
            } finally {
                setLoading(false);
            }
        };
        fetchVerificationData();
    }, [courseId, userId]);

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB');

    if (loading) return <Preloader />;
    if (error) return <PageContainer><h1 style={{textAlign: 'center'}}>{error}</h1></PageContainer>;

    // Split objectives and outcomes into lines for numbered list display
    const objectiveLines = data.course.objective ? data.course.objective.split('\n').filter(line => line.trim() !== '') : [];
    const outcomeLines = data.course.outcome ? data.course.outcome.split('\n').filter(line => line.trim() !== '') : [];

    return (
        <PageContainer>
            <Header>
                <Logo src={logo} alt="SeekMyCourse Logo" />
            </Header>
            <ContentWrapper>
                <SectionTitle>Student Details</SectionTitle>
                <DetailRow><DetailLabel>First Name:</DetailLabel> <span>{data.user.firstName}</span></DetailRow>
                <DetailRow><DetailLabel>Last Name:</DetailLabel> <span>{data.user.lastName}</span></DetailRow>

                <SectionTitle>Course Details</SectionTitle>
                <DetailRow><DetailLabel>Course Topic:</DetailLabel> <span>{data.course.topic}</span></DetailRow>
                <DetailRow><DetailLabel>Started On:</DetailLabel> <span>{formatDate(data.course.startDate)}</span></DetailRow>
                <DetailRow><DetailLabel>Completed On:</DetailLabel> <span>{formatDate(data.course.completionDate)}</span></DetailRow>
                <DetailRow><DetailLabel>Score:</DetailLabel> <span>{data.course.percentageScored}%</span></DetailRow>

                <SectionTitle>Course Objective</SectionTitle>
                {objectiveLines.length > 0 ? (
                    <FormattedList>
                        {objectiveLines.map((line, i) => (
                            <li key={`obj-${i}`}>{line.trim()}</li>
                        ))}
                    </FormattedList>
                ) : (
                    <p style={{color: 'white'}}>No objectives provided.</p>
                )}

                <SectionTitle>Course Outcome</SectionTitle>
                {outcomeLines.length > 0 ? (
                    <FormattedList>
                        {outcomeLines.map((line, i) => (
                            <li key={`out-${i}`}>{line.trim()}</li>
                        ))}
                    </FormattedList>
                ) : (
                    <p style={{color: 'white'}}>No outcomes provided.</p>
                )}

                <SectionTitle>Course Index</SectionTitle>
                {data.course.index.subtopics.map((subtopic, index) => (
                    <div key={index}>
                        <h4>{subtopic.title}</h4>
                        <ul>
                            {subtopic.lessons.map((lesson, i) => <li key={i}>{lesson.title}</li>)}
                        </ul>
                    </div>
                ))}
            </ContentWrapper>
            <FooterText>Start your learning journey with SeekMYCOURSE TODAY!</FooterText>
        </PageContainer>
    );
};

export default VerificationPage;