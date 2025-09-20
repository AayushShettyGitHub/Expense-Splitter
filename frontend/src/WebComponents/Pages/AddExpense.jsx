import React from "react";
import Layout from "@/WebComponents/Pages/Layout";
import AddExpenseForm from "@/WebComponents/SideBarComponents/ManageExpense";

const AddExpense = () => {
  return (
    <Layout pageTitle="Add Expense">
      <AddExpenseForm />
    </Layout>
  );
};

export default AddExpense;
