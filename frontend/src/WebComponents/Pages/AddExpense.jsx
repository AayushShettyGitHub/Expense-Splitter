import React from "react";
import Layout from "@/WebComponents/Pages/Layout"; // the layout component for the page
import AddExpenseForm from "@/WebComponents/SideBarComponents/ManageExpense"; // the actual form logic

const AddExpense = () => {
  return (
    <Layout pageTitle="Add Expense">
      <AddExpenseForm />
    </Layout>
  );
};

export default AddExpense;
