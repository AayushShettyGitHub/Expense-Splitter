import React from "react";
import Layout from "@/WebComponents/Pages/Layout";
import ActiveEvent from "@/WebComponents/SideBarComponents/ActiveEvent";

const ActiveEventPage = () => {
  return (
    <Layout pageTitle="Active Events">
      <ActiveEvent />
    </Layout>
  );
};

export default ActiveEventPage;

