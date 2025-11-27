const page = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  return <div className="flex min-h-screen p-4 md:p-6 lg:p-8">page {id}</div>;
};

export default page;
