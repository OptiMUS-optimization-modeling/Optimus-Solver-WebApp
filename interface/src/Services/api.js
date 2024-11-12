const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const fetchProjects = async (navigate) => {
  try {
    const response = await fetch(`${BASE_URL}/projects/getList`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      navigate("/login");
      return;
    }

    const data = await response.json();
    return data.projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
  }
};

export const createProject = async (title) => {
  try {
    const response = await fetch(`${BASE_URL}/projects/createProject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ title }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating new project:", error);
    throw error;
  }
};

export const deleteProject = async (project_id) => {
  try {
    const response = await fetch(`${BASE_URL}/projects/deleteProject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ project_id }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

export const verifyToken = async (idToken) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/verifyToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: idToken }),
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
};

export const testAuth = async () => {
  try {
    const response = await fetch(`${BASE_URL}/auth/test`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error testing auth:", error);
    throw error;
  }
};

export const setSolver = async (project_id, solver) => {
  try {
    const response = await fetch(`${BASE_URL}/projects/setSolver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ project_id, solver }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error setting solver:", error);
    throw error;
  }
};

export const getScoreColor = (score) => {
  if (score <= 2) return "error";
  if (score <= 4) return "warning";
  return "success";
};
