import React from "react";
import Layout from "@/WebComponents/Pages/Layout";
import Budget from "@/WebComponents/SideBarComponents/Budget";

const BudgetPage = () => {
  return (
    <Layout pageTitle="Manage Budget">
      <Budget />
    </Layout>
  );
};

export default BudgetPage;
