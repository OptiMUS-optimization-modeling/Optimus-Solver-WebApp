import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard({ user, isDark, setIsDark }) {
  // get the list of projects on page load
  const [projects, setProjects] = useState([]);
  let navigate = useNavigate();
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState("");

  // fetchProjects
  const fetchProjects = useCallback(async () => {
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/projects/getList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            console.log("Projects:", data["projects"]);
            setProjects(data["projects"]);
          }
        });
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [navigate]);

  // setProjects
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = (project_id) => {
    navigate("/project/" + project_id);
  };

  const handleCreateProject = () => {
    console.log("Creating new project...");
    // send a request to create a new project
    // then fetch the updated list of projects
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/projects/createProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newProjectTitle,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("New Project:", data);
          fetchProjects();
        });
    } catch (error) {
      console.error("Error creating new project:", error);
      alert("Error creating new project!");
    }
  };

  const deleteProject = (project_id) => {
    console.log("Deleting project:", project_id);
    // send a request to delete the project
    // then fetch the updated list of projects
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/projects/deleteProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project_id,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Delete Project:", data);
          fetchProjects();
          document.getElementById("delete_confirm_modal").close();
        });
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="flex, w-full flex flex-col justify-center items-center">
      <div className="card w-4/5 my-10">
        <div className="overflow-x-auto">
          <table className="table">
            {/* head */}
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Owner</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* project rows */}

              {projects.map((project) => (
                <tr key={project.id} className="">
                  <th
                    className="cursor-pointer hover:text-primary hover:opacity"
                    onClick={() => handleProjectClick(project.id)} // Add onClick event handler
                  >
                    {project.title}
                  </th>
                  <td>{project.owner}</td>
                  <td>{project.lastUpdated}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => {
                        setDeleteProjectId(project.id);
                        document
                          .getElementById("delete_confirm_modal")
                          .showModal();
                      }}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {/* last row for creating new projects */}
              <tr
                className="cursor-pointer"
                onClick={() => {
                  document.getElementById("new_project_modal").showModal();
                }}
              >
                <th className="text-success hover:opacity-80">
                  <i className="fas fa-plus"></i> New Project
                </th>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="new_project_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Create a new project</h3>
          <div className="divider"></div>

          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Creating new project...");
              document.getElementById("new_project_modal").close();
            }}
          >
            <div className="form-control">
              <input
                type="text text-primary"
                className="input input-bordered"
                placeholder="Project Name"
                value={newProjectTitle}
                onChange={(e) => {
                  setNewProjectTitle(e.target.value);
                }}
              />
            </div>
            <div className="form-control">
              <button
                type="submit"
                className="btn btn-primary mt-4"
                onClick={handleCreateProject}
              >
                Create
              </button>
            </div>
          </form>
        </div>
        {/* <form method="dialog" className="">
                    <button>close</button>
                </form> */}
      </dialog>

      <dialog id="delete_confirm_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Are you sure you want to delete this project?
          </h3>
          <div className="divider"></div>
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Deleting project...");
              deleteProject(deleteProjectId);
            }}
          >
            <div className="form-control">
              <button
                type="submit"
                className="btn btn-error mt-4"
                onClick={() => {
                  deleteProject(deleteProjectId);
                }}
              >
                Yes, delete it
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="">
          <button></button>
        </form>
      </dialog>
    </div>
  );
}

export default Dashboard;
