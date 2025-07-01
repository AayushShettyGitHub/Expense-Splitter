import React from "react";
import Layout from "@/WebComponents/Pages/Layout"; // the layout component for the page
import ViewExpense from "@/WebComponents/SideBarComponents/ViewExpense";

const ViewExpPage = () => {
  return (
    <Layout pageTitle="View Expenses">
      <ViewExpense />
    </Layout>
  );
};

export default ViewExpPage;
