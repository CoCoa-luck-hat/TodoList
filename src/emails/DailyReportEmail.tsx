import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Tailwind,
  Hr
} from "@react-email/components";
import * as React from "react";

interface DailyReportEmailProps {
  userName: string;
  reportMessage: string;
  completedTasks: string[];
  appLink: string;
}

export const DailyReportEmail = ({
  userName = "Team Member",
  reportMessage = "Here is my daily status update.",
  completedTasks = ["Task 1", "Task 2"],
  appLink = "https://example.com"
}: DailyReportEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Daily Status Report from {userName}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto mt-8 max-w-xl">
            <Heading className="text-2xl font-bold text-gray-900 mb-2">
              Daily Status Report
            </Heading>
            <Text className="text-gray-500 mb-6">
              Submitted by <strong>{userName}</strong>
            </Text>

            <Section className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
              <Text className="text-gray-800 m-0 whitespace-pre-wrap">
                {reportMessage}
              </Text>
            </Section>

            {completedTasks.length > 0 && (
              <>
                <Heading as="h3" className="text-lg font-semibold text-gray-800 mb-3">
                  Completed Tasks Today
                </Heading>
                <Section className="mb-6">
                  <ul className="pl-5 m-0 text-gray-700">
                    {completedTasks.map((task, index) => (
                      <li key={index} className="mb-1">{task}</li>
                    ))}
                  </ul>
                </Section>
              </>
            )}

            <Hr className="border-gray-300 my-6" />

            <Section className="text-center">
              <Link
                href={appLink}
                className="bg-indigo-600 text-white rounded-md px-6 py-3 text-base font-semibold no-underline"
              >
                Go to Dashboard
              </Link>
            </Section>
            
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DailyReportEmail;
