
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";
import { Clock, Users, Target, CheckCircle, Brain, Award } from "lucide-react";

interface TestData {
  title: string;
  category: string;
  description: string;
  benefits: string[];
  targetAudience: string[];
  instructions: string[];
  duration: string;
  questions: number;
  iframeUrl: string;
}

const testData: Record<string, TestData> = {
  "mbti": {
    title: "MBTI Personality Test",
    category: "Personality",
    description: "The Myers-Briggs Type Indicator (MBTI) is one of the most widely used personality assessment tools. It helps you understand your psychological preferences and how you perceive the world and make decisions.",
    benefits: [
      "Understand your personality type and preferences",
      "Improve communication with others",
      "Make better career choices",
      "Enhance team collaboration",
      "Develop self-awareness"
    ],
    targetAudience: [
      "Students choosing career paths",
      "Professionals seeking career development",
      "Team leaders and managers",
      "Anyone interested in self-discovery"
    ],
    instructions: [
      "Answer all questions honestly based on your natural preferences",
      "Don't overthink - go with your first instinct",
      "There are no right or wrong answers",
      "The test takes about 15-20 minutes to complete"
    ],
    duration: "15-20 minutes",
    questions: 93,
    iframeUrl: "https://auth.rafiei.co/esanj/mbti"
  },
  "disc": {
    title: "DISC Personality Assessment",
    category: "Personality",
    description: "DISC is a behavior assessment tool that measures four primary behavior styles: Dominance, Influence, Steadiness, and Conscientiousness. It helps you understand your behavioral tendencies and communication style.",
    benefits: [
      "Identify your primary behavioral style",
      "Improve workplace communication",
      "Better understand team dynamics",
      "Enhance leadership skills",
      "Reduce interpersonal conflicts"
    ],
    targetAudience: [
      "Business professionals",
      "Team members and leaders",
      "Sales professionals",
      "HR professionals",
      "Anyone in customer-facing roles"
    ],
    instructions: [
      "Select the word that best describes you in each group",
      "Consider your behavior in work situations",
      "Be honest about your natural tendencies",
      "Complete all sections for accurate results"
    ],
    duration: "10-15 minutes",
    questions: 24,
    iframeUrl: "https://auth.rafiei.co/esanj/disc"
  },
  "mii": {
    title: "Multiple Intelligence Inventory (MII)",
    category: "Intelligence",
    description: "Based on Howard Gardner's theory of multiple intelligences, this assessment identifies your strongest intelligence types among eight different categories of human intelligence.",
    benefits: [
      "Discover your unique intelligence strengths",
      "Choose learning methods that work best for you",
      "Identify suitable career paths",
      "Understand different types of intelligence",
      "Appreciate diverse talents in others"
    ],
    targetAudience: [
      "Students and educators",
      "Career changers",
      "Parents understanding their children",
      "Training and development professionals"
    ],
    instructions: [
      "Rate how well each statement describes you",
      "Consider your natural abilities and preferences",
      "Think about activities you enjoy and excel at",
      "Be honest about your strengths and weaknesses"
    ],
    duration: "20-25 minutes",
    questions: 80,
    iframeUrl: "https://auth.rafiei.co/esanj/mii"
  },
  "ocq": {
    title: "Organizational Culture Questionnaire (OCQ)",
    category: "Career",
    description: "This assessment helps you understand different organizational cultures and identify which work environments align best with your values and working style preferences.",
    benefits: [
      "Identify your preferred work culture",
      "Make better job choices",
      "Understand organizational dynamics",
      "Improve job satisfaction",
      "Enhance cultural fit in teams"
    ],
    targetAudience: [
      "Job seekers",
      "Career changers",
      "HR professionals",
      "Organizational leaders",
      "Management consultants"
    ],
    instructions: [
      "Think about your ideal work environment",
      "Consider what motivates you at work",
      "Rate statements based on your preferences",
      "Focus on what energizes you professionally"
    ],
    duration: "15 minutes",
    questions: 24,
    iframeUrl: "https://auth.rafiei.co/esanj/ocq"
  },
  "msq": {
    title: "Minnesota Satisfaction Questionnaire (MSQ)",
    category: "Career",
    description: "The MSQ measures how satisfied you are with various aspects of your job or career, helping identify areas for improvement and career development opportunities.",
    benefits: [
      "Assess your current job satisfaction",
      "Identify areas for career improvement",
      "Make informed career decisions",
      "Understand what motivates you at work",
      "Plan professional development"
    ],
    targetAudience: [
      "Working professionals",
      "Career counselors",
      "HR professionals",
      "Managers and supervisors",
      "Anyone considering career changes"
    ],
    instructions: [
      "Think about your current or recent job",
      "Rate your satisfaction with each aspect",
      "Be honest about your feelings",
      "Consider both positive and negative aspects"
    ],
    duration: "10-15 minutes",
    questions: 20,
    iframeUrl: "https://auth.rafiei.co/esanj/msq"
  },
  "eq-shatt": {
    title: "Emotional Intelligence Test (Shatt)",
    category: "Emotional",
    description: "This comprehensive emotional intelligence assessment measures your ability to understand, manage, and effectively use emotions in positive ways to communicate effectively and empathize with others.",
    benefits: [
      "Understand your emotional strengths",
      "Improve interpersonal relationships",
      "Enhance leadership capabilities",
      "Better stress management",
      "Increase self-awareness"
    ],
    targetAudience: [
      "Leaders and managers",
      "Customer service professionals",
      "Counselors and therapists",
      "Teachers and educators",
      "Anyone in people-focused roles"
    ],
    instructions: [
      "Answer based on how you typically react",
      "Consider your emotional responses honestly",
      "Think about recent situations",
      "Don't try to give 'ideal' answers"
    ],
    duration: "20-25 minutes",
    questions: 133,
    iframeUrl: "https://auth.rafiei.co/esanj/eq-shatt"
  },
  "raven-iq": {
    title: "Raven's Progressive Matrices IQ Test",
    category: "Intelligence",
    description: "Raven's Progressive Matrices is a non-verbal intelligence test that measures abstract reasoning ability and fluid intelligence through pattern recognition and logical thinking.",
    benefits: [
      "Measure abstract reasoning ability",
      "Assess fluid intelligence",
      "Cultural-fair intelligence assessment",
      "Identify problem-solving strengths",
      "Understand cognitive patterns"
    ],
    targetAudience: [
      "Students preparing for assessments",
      "Job applicants for analytical roles",
      "Anyone curious about cognitive abilities",
      "Educational professionals"
    ],
    instructions: [
      "Look at each pattern carefully",
      "Identify the logical sequence",
      "Choose the piece that completes the pattern",
      "Work at your own pace but be mindful of time"
    ],
    duration: "45-60 minutes",
    questions: 60,
    iframeUrl: "https://auth.rafiei.co/esanj/raven-iq"
  },
  "cattell-iq": {
    title: "Cattell Culture Fair Intelligence Test (Form B)",
    category: "Intelligence",
    description: "The Cattell Culture Fair Intelligence Test is designed to measure fluid intelligence while minimizing cultural and educational influences, providing a fair assessment of cognitive ability.",
    benefits: [
      "Culture-fair intelligence measurement",
      "Assess fluid intelligence capacity",
      "Minimize educational bias",
      "Understand cognitive potential",
      "Compare abilities fairly across backgrounds"
    ],
    targetAudience: [
      "Students from diverse backgrounds",
      "International job applicants",
      "Educational assessors",
      "Career counselors"
    ],
    instructions: [
      "Complete each section within the time limit",
      "Work through problems systematically",
      "Don't spend too long on any single item",
      "Use logical reasoning to solve problems"
    ],
    duration: "30-40 minutes",
    questions: 46,
    iframeUrl: "https://auth.rafiei.co/esanj/cattell-iq"
  },
  "self-esteem": {
    title: "Coopersmith Self-Esteem Inventory",
    category: "Mental Health",
    description: "The Coopersmith Self-Esteem Inventory measures attitudes toward the self in social, academic, family, and personal areas of experience, providing insight into self-worth and confidence levels.",
    benefits: [
      "Assess your self-esteem levels",
      "Identify areas for personal growth",
      "Understand confidence patterns",
      "Improve self-image",
      "Track personal development progress"
    ],
    targetAudience: [
      "Individuals seeking self-improvement",
      "Students and young adults",
      "Counseling clients",
      "Personal development enthusiasts"
    ],
    instructions: [
      "Answer honestly about how you see yourself",
      "Consider your typical feelings and thoughts",
      "Don't overthink your responses",
      "Reflect on your general self-perception"
    ],
    duration: "10-15 minutes",
    questions: 58,
    iframeUrl: "https://auth.rafiei.co/esanj/self-esteem"
  },
  "holland": {
    title: "Holland Interest Inventory (HII)",
    category: "Career",
    description: "Based on John Holland's theory, this assessment identifies your interests and matches them with suitable career environments and occupations across six personality types (RIASEC).",
    benefits: [
      "Discover career interests and preferences",
      "Match personality to suitable careers",
      "Explore new career possibilities",
      "Make informed educational choices",
      "Understand work environment preferences"
    ],
    targetAudience: [
      "Students choosing majors",
      "Career changers",
      "Recent graduates",
      "Career counselors",
      "Anyone exploring career options"
    ],
    instructions: [
      "Indicate your level of interest in each activity",
      "Consider what you enjoy doing",
      "Think about your natural preferences",
      "Be honest about your interests, not abilities"
    ],
    duration: "15-20 minutes",
    questions: 198,
    iframeUrl: "https://auth.rafiei.co/esanj/holland"
  },
  "16pf": {
    title: "16 Personality Factors (16PF)",
    category: "Personality",
    description: "The 16PF questionnaire measures 16 primary personality traits, providing a comprehensive profile of your personality structure and behavioral tendencies.",
    benefits: [
      "Comprehensive personality analysis",
      "Understand behavioral patterns",
      "Improve self-awareness",
      "Enhance interpersonal relationships",
      "Support career development decisions"
    ],
    targetAudience: [
      "HR professionals",
      "Career counselors",
      "Managers and leaders",
      "Individuals in therapy or coaching",
      "Anyone seeking deep self-understanding"
    ],
    instructions: [
      "Choose the response that best describes you",
      "Answer based on how you generally are",
      "Don't try to present an ideal image",
      "Complete all questions for accurate results"
    ],
    duration: "35-50 minutes",
    questions: 185,
    iframeUrl: "https://auth.rafiei.co/esanj/16pf"
  },
  "procrastination": {
    title: "Tuckman Procrastination Scale (TPS)",
    category: "Behavioral",
    description: "The TPS measures your tendency to procrastinate across different areas of life, helping identify patterns and develop strategies for improved time management and productivity.",
    benefits: [
      "Identify procrastination patterns",
      "Understand productivity barriers",
      "Develop time management strategies",
      "Improve task completion rates",
      "Enhance personal effectiveness"
    ],
    targetAudience: [
      "Students struggling with deadlines",
      "Professionals seeking productivity",
      "Anyone with time management challenges",
      "Coaches and counselors"
    ],
    instructions: [
      "Think about your typical behavior patterns",
      "Consider how you usually handle tasks",
      "Be honest about your tendencies",
      "Rate statements based on your general behavior"
    ],
    duration: "10 minutes",
    questions: 16,
    iframeUrl: "https://auth.rafiei.co/esanj/procrastination"
  },
  "perfectionism": {
    title: "Hewitt Perfectionism Inventory (HPI)",
    category: "Behavioral",
    description: "The HPI measures different dimensions of perfectionism, helping you understand whether your perfectionist tendencies are helpful or potentially problematic for your well-being.",
    benefits: [
      "Understand your perfectionism patterns",
      "Identify healthy vs. unhealthy perfectionism",
      "Improve stress management",
      "Enhance performance without burnout",
      "Develop balanced achievement goals"
    ],
    targetAudience: [
      "High achievers",
      "Students and professionals",
      "Individuals experiencing stress",
      "Coaches and therapists"
    ],
    instructions: [
      "Rate how much each statement applies to you",
      "Think about your typical standards and expectations",
      "Consider your reactions to mistakes",
      "Be honest about your perfectionist tendencies"
    ],
    duration: "15 minutes",
    questions: 45,
    iframeUrl: "https://auth.rafiei.co/esanj/perfectionism"
  },
  "academic-motivation": {
    title: "Hermans Academic Motivation Scale (HEMS)",
    category: "Educational",
    description: "The HEMS assesses different types of motivation for academic achievement, helping students understand what drives their learning and academic performance.",
    benefits: [
      "Understand your learning motivation",
      "Improve study habits and performance",
      "Identify motivation barriers",
      "Enhance academic satisfaction",
      "Develop effective learning strategies"
    ],
    targetAudience: [
      "Students at all levels",
      "Educational counselors",
      "Teachers and professors",
      "Academic coaches",
      "Parents of students"
    ],
    instructions: [
      "Think about why you engage in academic activities",
      "Consider your feelings about studying and learning",
      "Rate statements about your academic behavior",
      "Be honest about your motivations"
    ],
    duration: "15 minutes",
    questions: 28,
    iframeUrl: "https://auth.rafiei.co/esanj/academic-motivation"
  },
  "mbti-kids": {
    title: "MBTI for Kids (MMTIC)",
    category: "Personality",
    description: "The Murphy-Meisgeier Type Indicator for Children is a simplified version of the MBTI designed specifically for younger individuals to understand their personality preferences.",
    benefits: [
      "Help children understand their personality",
      "Improve parent-child communication",
      "Support educational choices",
      "Enhance self-confidence in children",
      "Appreciate individual differences"
    ],
    targetAudience: [
      "Children and teenagers",
      "Parents and guardians",
      "Educational counselors",
      "Teachers and coaches",
      "Child psychologists"
    ],
    instructions: [
      "Help younger children read and understand questions",
      "Encourage honest responses",
      "Make it fun and non-judgmental",
      "Focus on natural preferences, not abilities"
    ],
    duration: "15 minutes",
    questions: 70,
    iframeUrl: "https://auth.rafiei.co/esanj/mbti-kids"
  },
  "hope": {
    title: "Miller Hope Scale (MHS)",
    category: "Mental Health",
    description: "The Miller Hope Scale measures your sense of hope and optimism about the future, which is strongly linked to mental health, resilience, and life satisfaction.",
    benefits: [
      "Assess your hope and optimism levels",
      "Understand future-oriented thinking",
      "Identify resilience factors",
      "Support mental health awareness",
      "Track positive psychology measures"
    ],
    targetAudience: [
      "Individuals in therapy or counseling",
      "People facing life challenges",
      "Mental health professionals",
      "Wellness coaches",
      "Anyone interested in positive psychology"
    ],
    instructions: [
      "Think about your general outlook on life",
      "Consider your feelings about the future",
      "Answer based on your typical mindset",
      "Be honest about your hope levels"
    ],
    duration: "10 minutes",
    questions: 48,
    iframeUrl: "https://auth.rafiei.co/esanj/hope"
  },
  "internet-addiction": {
    title: "Internet Addiction Test (IAT)",
    category: "Behavioral",
    description: "The IAT assesses the extent of internet usage and identifies patterns that may indicate problematic internet use or addiction affecting daily life and relationships.",
    benefits: [
      "Assess internet usage patterns",
      "Identify potential addiction signs",
      "Understand digital wellness",
      "Improve work-life balance",
      "Develop healthy technology habits"
    ],
    targetAudience: [
      "Heavy internet users",
      "Students and professionals",
      "Parents concerned about children",
      "Mental health professionals",
      "Digital wellness advocates"
    ],
    instructions: [
      "Think about your internet usage honestly",
      "Consider the impact on your daily life",
      "Rate how often you experience each situation",
      "Include all forms of internet use"
    ],
    duration: "10 minutes",
    questions: 20,
    iframeUrl: "https://auth.rafiei.co/esanj/internet-addiction"
  },
  "ocd": {
    title: "Maudsley Obsessive-Compulsive Inventory (MOCI)",
    category: "Mental Health",
    description: "The MOCI is a screening tool for obsessive-compulsive symptoms, helping identify patterns of obsessive thoughts and compulsive behaviors that may need professional attention.",
    benefits: [
      "Screen for OCD symptoms",
      "Understand obsessive-compulsive patterns",
      "Support mental health awareness",
      "Guide professional consultation decisions",
      "Track symptom changes over time"
    ],
    targetAudience: [
      "Individuals with repetitive thoughts or behaviors",
      "Mental health professionals",
      "People seeking self-understanding",
      "Therapists and counselors"
    ],
    instructions: [
      "Answer based on your recent experiences",
      "Be honest about repetitive thoughts and behaviors",
      "Don't try to minimize or exaggerate symptoms",
      "Consider seeking professional help if scores are high"
    ],
    duration: "10 minutes",
    questions: 30,
    iframeUrl: "https://auth.rafiei.co/esanj/ocd"
  },
  "happiness": {
    title: "Oxford Happiness Inventory (OHI)",
    category: "Mental Health",
    description: "The OHI measures your general level of happiness and life satisfaction across multiple dimensions of well-being and positive emotions.",
    benefits: [
      "Assess your happiness levels",
      "Understand well-being factors",
      "Identify areas for improvement",
      "Track life satisfaction changes",
      "Support positive psychology goals"
    ],
    targetAudience: [
      "Anyone interested in well-being",
      "Life coaches and counselors",
      "Individuals in personal development",
      "Positive psychology practitioners",
      "People seeking life balance"
    ],
    instructions: [
      "Think about your general feelings and attitudes",
      "Consider your typical emotional state",
      "Answer honestly about your life satisfaction",
      "Focus on your overall happiness, not temporary moods"
    ],
    duration: "15 minutes",
    questions: 29,
    iframeUrl: "https://auth.rafiei.co/esanj/happiness"
  },
  "loneliness": {
    title: "Social and Emotional Loneliness Scale (SLFS)",
    category: "Mental Health",
    description: "The SLFS measures different types of loneliness - social and emotional - helping understand your social connectedness and relationship satisfaction.",
    benefits: [
      "Understand your loneliness patterns",
      "Identify social and emotional needs",
      "Improve relationship building",
      "Support mental health awareness",
      "Guide social skill development"
    ],
    targetAudience: [
      "Individuals feeling isolated",
      "People in life transitions",
      "Mental health professionals",
      "Social workers and counselors",
      "Anyone working on relationships"
    ],
    instructions: [
      "Think about your social relationships honestly",
      "Consider both quantity and quality of connections",
      "Rate your feelings about social situations",
      "Be honest about emotional support needs"
    ],
    duration: "10 minutes",
    questions: 37,
    iframeUrl: "https://auth.rafiei.co/esanj/loneliness"
  },
  "entrepreneurial": {
    title: "Entrepreneurial Personality Test",
    category: "Career",
    description: "This assessment evaluates your entrepreneurial traits, risk tolerance, innovation mindset, and business acumen to determine your potential for entrepreneurial success.",
    benefits: [
      "Assess entrepreneurial potential",
      "Understand business personality traits",
      "Identify strengths for business ventures",
      "Evaluate risk tolerance",
      "Guide career decisions in business"
    ],
    targetAudience: [
      "Aspiring entrepreneurs",
      "Business students",
      "Career changers",
      "Business coaches",
      "Innovation professionals"
    ],
    instructions: [
      "Think about your approach to business and innovation",
      "Consider your risk-taking tendencies",
      "Answer based on your natural inclinations",
      "Focus on your authentic business personality"
    ],
    duration: "20 minutes",
    questions: 54,
    iframeUrl: "https://auth.rafiei.co/esanj/entrepreneurial"
  },
  "smart-path": {
    title: "Smart Path Test",
    category: "Career",
    description: "The Smart Path Test is a comprehensive career guidance assessment that combines personality, interests, and skills to recommend optimal career paths and educational directions.",
    benefits: [
      "Comprehensive career guidance",
      "Personalized career recommendations",
      "Integrate personality with career choices",
      "Educational path suggestions",
      "Holistic career planning support"
    ],
    targetAudience: [
      "Students choosing careers",
      "Career changers at any age",
      "Recent graduates",
      "Career counselors",
      "Anyone seeking career clarity"
    ],
    instructions: [
      "Complete all sections thoroughly",
      "Answer honestly about interests and preferences",
      "Consider your natural abilities and skills",
      "Think about long-term career satisfaction"
    ],
    duration: "30-40 minutes",
    questions: 120,
    iframeUrl: "https://auth.rafiei.co/esanj/smart-path"
  }
};

const TestLanding = () => {
  const { slug } = useParams();
  const { translations } = useLanguage();
  const [showTestModal, setShowTestModal] = useState(false);

  const test = slug ? testData[slug] : null;

  if (!test) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Test Not Found</h1>
          <p className="text-muted-foreground">The requested test could not be found.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Hero
        title={test.title}
        subtitle={`${test.category} Assessment - ${test.duration}`}
        ctaText="Start Test"
        ctaLink="#test-details"
        backgroundType="glow"
      />

      <section id="test-details" className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <SectionTitle
                title="About This Test"
                subtitle={test.description}
              />

              {/* Benefits Section */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <CheckCircle className="mr-2 text-green-600" size={24} />
                    What You'll Discover
                  </h3>
                  <ul className="space-y-2">
                    {test.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Target Audience */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Target className="mr-2 text-blue-600" size={24} />
                    Who Should Take This Test
                  </h3>
                  <ul className="space-y-2">
                    {test.targetAudience.map((audience, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {audience}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Brain className="mr-2 text-purple-600" size={24} />
                    How to Take the Test
                  </h3>
                  <ol className="space-y-2">
                    {test.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2 font-semibold">{index + 1}.</span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Badge className="mb-4 bg-primary text-white">
                      {test.category}
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2">{test.title}</h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-sm">Duration</span>
                      </div>
                      <span className="font-semibold">{test.duration}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-sm">Questions</span>
                      </div>
                      <span className="font-semibold">{test.questions}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-sm">Results</span>
                      </div>
                      <span className="font-semibold">Instant</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setShowTestModal(true)}
                    className="w-full bg-black text-white hover:bg-black/90 rounded-full"
                    size="lg"
                  >
                    Start Test Now
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Free psychological assessment with instant results
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Test Modal */}
      <IframeModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={test.title}
        url={test.iframeUrl}
      />
    </MainLayout>
  );
};

export default TestLanding;
