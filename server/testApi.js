const axios = require("axios");

// Project data
const projectData = {
  title: "Weather Application",
  description:
    "A modern weather app that displays current and forecast weather data based on user location.",
  image:
    "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=850&q=80",
  technologies: ["React", "OpenWeather API", "Geolocation", "Tailwind CSS"],
  github: "https://github.com/yourusername/weather-app",
  demo: "https://yourweatherapp.com",
  featured: false,
};

// API endpoint
const apiUrl = "http://localhost:5000/api/projects";

// POST request to add a project
const addProject = async () => {
  try {
    const response = await axios.post(apiUrl, projectData);
    console.log("Project added successfully:", response.data);
  } catch (error) {
    console.error(
      "Error adding project:",
      error.response ? error.response.data : error.message
    );
  }
};

// Run the function
addProject();
