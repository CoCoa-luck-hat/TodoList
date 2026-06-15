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

interface TaskAssignedEmailProps {
  taskTitle: string;
  assignedBy: string;
  dueDate?: string;
  projectOrTeamName?: string;
  appLink: string;
}

export const TaskAssignedEmail = ({
  taskTitle = "New Task",
  assignedBy = "Someone",
  dueDate,
  projectOrTeamName,
  appLink = "https://example.com"
}: TaskAssignedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You have a new task assigned: {taskTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto mt-8 max-w-xl">
            <Heading className="text-2xl font-bold text-gray-900 mb-4">
              New Task Assigned
            </Heading>
            <Text className="text-gray-700 text-base mb-4">
              Hello! <strong>{assignedBy}</strong> has assigned a new task to you
              {projectOrTeamName ? ` in ${projectOrTeamName}` : ""}.
            </Text>
            
            <Section className="bg-indigo-50 rounded-md p-4 mb-6">
              <Text className="text-indigo-900 font-semibold m-0 text-lg">
                {taskTitle}
              </Text>
              {dueDate && (
                <Text className="text-indigo-700 m-0 mt-2 text-sm">
                  Due: {new Date(dueDate).toLocaleDateString()}
                </Text>
              )}
            </Section>

            <Section className="text-center mt-8">
              <Link
                href={appLink}
                className="bg-indigo-600 text-white rounded-md px-6 py-3 text-base font-semibold no-underline"
              >
                View Task
              </Link>
            </Section>
            
            <Text className="text-gray-400 text-sm mt-8 text-center">
              You're receiving this because your notification preferences are set to receive Task Assigned emails.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TaskAssignedEmail;
