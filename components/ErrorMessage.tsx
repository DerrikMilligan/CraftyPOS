import { Card, Container, Stack, Text } from "@mantine/core";

interface IErrorMEssageProps {
  message?: string;
  children?: React.ReactNode;
}

export default function ErrorMessage({ children, message }: IErrorMEssageProps) {
  return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">{message || ''}</Text>
          { children }
        </Stack>
      </Card>
    </Container>
  );
}


