import { useState, useEffect, useRef } from "react";
import { motion as Motion } from "framer-motion";
import {
  createProject,
  updateProject,
  uploadProjectImage,
  deleteProjectImage,
} from "../utils/api";

const ProjectForm = ({ project, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    imagePublicId: null,
    technologies: [],
    github: "",
    demo: "",
    featured: false,
  });
  const [techInput, setTechInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        image: project.image || "",
        imagePublicId: project.imagePublicId || null,
        technologies: project.technologies || [],
        github: project.github || "",
        demo: project.demo || "",
        featured: project.featured || false,
      });
      setImagePreview(project.image || null);
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large. Maximum size is 5MB.");
      return;
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or GIF image.");
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      setError("");

      // Delete the old image if it exists
      if (formData.imagePublicId) {
        await deleteProjectImage(formData.imagePublicId);
      }

      // Upload the new image
      const uploadResult = await uploadProjectImage(file);

      setFormData({
        ...formData,
        image: uploadResult.imageUrl,
        imagePublicId: uploadResult.publicId,
      });

      setUploadingImage(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (formData.imagePublicId) {
      try {
        await deleteProjectImage(formData.imagePublicId);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    setFormData({
      ...formData,
      image: "",
      imagePublicId: null,
    });
    setImagePreview(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTechInputChange = (e) => {
    setTechInput(e.target.value);
  };

  const handleTechKeyDown = (e) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault();

      // Split input by spaces to separate technologies
      const techArray = techInput
        .split(/\s+/)
        .filter((tech) => tech.trim() !== "");

      // Create a new array of technologies to add (excluding duplicates)
      const newTechs = techArray.filter(
        (tech) => !formData.technologies.includes(tech)
      );

      if (newTechs.length > 0) {
        setFormData({
          ...formData,
          technologies: [...formData.technologies, ...newTechs],
        });
      }

      setTechInput("");
    }
  };

  const handleAddTech = () => {
    if (techInput.trim()) {
      // Split input by spaces to separate technologies
      const techArray = techInput
        .split(/\s+/)
        .filter((tech) => tech.trim() !== "");

      // Create a new array of technologies to add (excluding duplicates)
      const newTechs = techArray.filter(
        (tech) => !formData.technologies.includes(tech)
      );

      if (newTechs.length > 0) {
        setFormData({
          ...formData,
          technologies: [...formData.technologies, ...newTechs],
        });
      }

      setTechInput("");
    }
  };

  const handleRemoveTech = (tech) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter((t) => t !== tech),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate form
    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      setLoading(false);
      return;
    }

    if (!formData.image) {
      setError("Image is required");
      setLoading(false);
      return;
    }

    if (formData.technologies.length === 0) {
      setError("At least one technology is required");
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await updateProject(project._id || project.id, formData);
      } else {
        await createProject(formData);
      }
      onSubmit();
    } catch (error) {
      console.error("Error saving project:", error);
      setError("Failed to save project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md mb-8"
    >
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Project" : "Add New Project"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Description*
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            ></textarea>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Project Image*
            </label>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="project-image"
                />
                <label
                  htmlFor="project-image"
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md cursor-pointer hover:bg-indigo-700 ${
                    uploadingImage ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadingImage ? "Uploading..." : "Choose Image"}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                )}
              </div>

              {uploadingImage && (
                <div className="flex items-center mt-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-indigo-500 animate-spin mr-2"></div>
                  <span className="text-gray-600">Uploading image...</span>
                </div>
              )}

              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-48 object-cover rounded-md border border-gray-300"
                  />
                </div>
              )}

              <p className="text-sm text-gray-500">
                Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Technologies*
            </label>
            <div className="flex">
              <input
                type="text"
                value={techInput}
                onChange={handleTechInputChange}
                onKeyDown={handleTechKeyDown}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add a technology (e.g., React)"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.technologies.map((tech, index) => (
                <div
                  key={index}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="ml-2 text-indigo-600 cursor-pointer hover:text-indigo-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {formData.technologies.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Add at least one technology
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              GitHub URL
            </label>
            <input
              type="url"
              name="github"
              value={formData.github}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Demo URL
            </label>
            <input
              type="url"
              name="demo"
              value={formData.demo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 font-medium">
                Feature this project on the home page
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${
              loading || uploadingImage ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Project"
              : "Add Project"}
          </button>
        </div>
      </form>
    </Motion.div>
  );
};

export default ProjectForm;
