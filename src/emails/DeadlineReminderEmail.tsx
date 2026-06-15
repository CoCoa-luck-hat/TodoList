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
  Tailwind
} from "@react-email/components";
import * as React from "react";

interface DeadlineReminderEmailProps {
  taskTitle: string;
  dueDate: string;
  projectOrTeamName?: string;
  appLink: string;
}

export const DeadlineReminderEmail = ({
  taskTitle = "Upcoming Task",
  dueDate,
  projectOrTeamName,
  appLink = "https://example.com"
}: DeadlineReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Deadline Reminder: {taskTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto mt-8 max-w-xl">
            <Heading className="text-2xl font-bold text-red-600 mb-4">
              Deadline Approaching
            </Heading>
            <Text className="text-gray-700 text-base mb-4">
              Hello! This is a reminder that a task assigned to you
              {projectOrTeamName ? ` in ${projectOrTeamName}` : ""} is due soon.
            </Text>
            
            <Section className="bg-red-50 rounded-md p-4 mb-6 border border-red-100">
              <Text className="text-red-900 font-semibold m-0 text-lg">
                {taskTitle}
              </Text>
              {dueDate && (
                <Text className="text-red-700 m-0 mt-2 font-medium">
                  Due: {new Date(dueDate).toLocaleDateString()}
                </Text>
              )}
            </Section>

            <Section className="text-center mt-8">
              <Link
                href={appLink}
                className="bg-red-600 text-white rounded-md px-6 py-3 text-base font-semibold no-underline"
              >
                View Task
              </Link>
            </Section>
            
            <Text className="text-gray-400 text-sm mt-8 text-center">
              You're receiving this because your notification preferences are set to receive Deadline Reminders.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DeadlineReminderEmail;
