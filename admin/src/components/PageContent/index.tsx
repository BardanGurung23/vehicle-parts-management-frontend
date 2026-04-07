import { Loader } from "@mantine/core";

interface PageContentProps {
  loading?: boolean;
  children: any;
}

const PageContent = ({ loading, children }: PageContentProps) => {
  if (loading) {
    return <Loader />;
  } else
    return (
      <div className={`rounded-2xl mb-5 p-4  ${loading ? "opacity-40" : ""}`}>
        {children}
      </div>
    );
};

export default PageContent;
