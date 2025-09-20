import React, { useEffect } from "react";
import Layout from "@/WebComponents/Pages/Layout";
import CreateGroup from "@/WebComponents/SideBarComponents/CreateGroup";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/use-toast";

const CreateGroupPage = () => {


  return (
    <Layout pageTitle="Create Group">
      <CreateGroup />
    </Layout>
  );
};

export default CreateGroupPage;
