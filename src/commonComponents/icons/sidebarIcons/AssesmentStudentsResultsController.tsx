import React from "react";
import { useLocation } from "react-router-dom";
import AssesmentStudentResultsIcon from "./AssesmentStudentsResultsIcon";

const AssesmentStudentResultsController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/admin/assesment-results";

  return <AssesmentStudentResultsIcon isActive={isActive} />;
};

export default AssesmentStudentResultsController;