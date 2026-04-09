type LoadingScreenProps = {
  message: string;
};

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <main className="loading-screen">
      <p>{message}</p>
    </main>
  );
}