import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import config from "../config";
import { toast } from "react-hot-toast";

export default function ProductUpload() {
  const navigate = useNavigate();
  const { product_id } = useParams();
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState({
    title: "",
    price: "",
    description: "",
    images: [],
    condition: "",
    category: "",
    allowRecording: false,
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const categoryMapping = {
    Computers: 1,
    "Phones/Tablets": 2,
    "Tech Accessories": 3,
    Books: 4,
    "Clothes/Furniture": 5,
  };

  const reverseCategoryMapping = Object.entries(categoryMapping).reduce(
    (acc, [key, value]) => {
      acc[value] = key;
      return acc;
    },
    {}
  );

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      toast.error("Please login to upload products");
      navigate("/login");
      return;
    }

    setUser(JSON.parse(userData));

    if (product_id) {
      setIsEditing(true);
      fetchProduct(product_id);
    }
  }, [navigate, product_id]);

  const fetchProduct = async (id) => {
    try {
      const response = await axios.get(`${config.apiUrl}/products/${id}`);
      const p = response.data;

      setProduct({
        title: p.name,
        price: p.price,
        description: p.description,
        images: [],
        condition: p.condition,
        category: reverseCategoryMapping[p.category_id] || "",
        allowRecording: false,
      });

      setPreview(
        p.image_url?.startsWith("/")
          ? `${config.apiUrl}${p.image_url}`
          : p.image_url
      );
    } catch (err) {
      toast.error("Failed to load product details");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!product.title) newErrors.title = true;
    if (!product.price) newErrors.price = true;
    if (!product.description) newErrors.description = true;
    if (!product.category) newErrors.category = true;
    if (!product.condition) newErrors.condition = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setErrors((prev) => ({ ...prev, [name]: false }));

    if (type === "checkbox") {
      setProduct((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "images" && files.length > 0) {
      const imageFiles = Array.from(files);
      const previews = imageFiles.map((file) => URL.createObjectURL(file));
      setPreview((prev) => [...prev, ...previews]);
      setProduct((prev) => ({ ...prev, images: [...prev.images, ...imageFiles] }));
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageReset = () => {
    setPreview([]);
    setProduct((prev) => ({ ...prev, images: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const formData = new FormData();
      formData.append("name", product.title);
      formData.append("description", product.description);
      formData.append("price", parseFloat(product.price));
      formData.append("condition", product.condition);
      formData.append("category_id", categoryMapping[product.category]);

      if (product.images && product.images.length > 0) {
        product.images.forEach((img) => {
          formData.append("images", img);
        });
      }

      if (isEditing) {
        await axios.put(
          `${config.apiUrl}/products/${product_id}`,
          {
            name: product.title,
            description: product.description,
            price: parseFloat(product.price),
            condition: product.condition,
            category_id: categoryMapping[product.category],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Product updated successfully!");
        navigate("/profile");
      } else {
        try {
          const response = await axios.post(
            `${config.apiUrl}/products/`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          toast.success("Your product has been listed!");
          setSubmitted(true);
        } catch (error) {
          if (error.response?.data?.error?.includes('maximum limit of 100')) {
            toast.error("You have reached the maximum limit of 100 active products. Please remove some products before adding new ones.");
          } else {
            toast.error("Something went wrong. Try again.");
          }
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white shadow-xl rounded-xl p-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold text-[#2E0854] 
            tracking-wide text-center mb-8 relative"
          >
            {isEditing ? "Edit Product" : "Upload Product"}
            <span className="block w-24 h-1 bg-[#FFCC00] mx-auto mt-3 rounded-full shadow-md"></span>
          </motion.h2>

          <p className="text-center text-gray-600 mb-6">
            {isEditing
              ? "Modify your listing below."
              : "Fill out the form below to list your product for sale."}
          </p>

          {submitted ? (
            <div className="text-center mt-6">
              <p className="text-green-600 font-semibold">
                ✅ Your item has been listed!
              </p>
              <p className="text-gray-600 mt-2 mb-4">
                Your listing will be reviewed by our team and will appear in the
                marketplace once approved.
              </p>
              <Link to="/home">
                <button
                  className="mt-4 px-6 py-2 bg-[#FFCC00] text-[#2E0854] 
                rounded-full font-medium hover:bg-yellow-300 transition"
                >
                  Back to Home
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-t-2 border-[#2E0854] pt-6">
                <h3 className="text-lg font-semibold text-[#2E0854] mb-2">
                  Product Info
                </h3>
                <hr className="mb-4 border-[#2E0854]" />

                <div>
                  <label className="block mb-1 font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={product.title}
                    onChange={handleChange}
                    className={`w-full border-2 p-3 rounded-lg ${
                      errors.title ? "border-red-500" : "border-black"
                    }`}
                    placeholder="Product name"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">Required</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    className={`w-full border-2 p-3 rounded-lg ${
                      errors.price ? "border-red-500" : "border-black"
                    }`}
                    placeholder="Price"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">Required</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    className={`w-full border-2 p-3 rounded-lg h-24 ${
                      errors.description ? "border-red-500" : "border-black"
                    }`}
                    placeholder="Product description"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">Required</p>
                  )}
                </div>
              </div>

              <div className="border-t-2 border-[#2E0854] pt-6">
                <h3 className="text-lg font-semibold text-[#2E0854] mb-2">
                  Listing Details
                </h3>
                <hr className="mb-4 border-[#2E0854]" />

                <div>
                  <label className="block mb-1 font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    className={`w-full border-2 p-3 rounded-lg ${
                      errors.category ? "border-red-500" : "border-black"
                    }`}
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categoryMapping).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">Required</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Product Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="condition"
                    value={product.condition}
                    onChange={handleChange}
                    className={`w-full border-2 p-3 rounded-lg ${
                      errors.condition ? "border-red-500" : "border-black"
                    }`}
                  >
                    <option value="">Select Condition</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Acceptable">Used - Acceptable</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                  {errors.condition && (
                    <p className="text-sm text-red-500 mt-1">Required</p>
                  )}
                </div>
              </div>

              <div className="border-t-2 border-[#2E0854] pt-6">
                <h3 className="text-lg font-semibold text-[#2E0854] mb-2">
                  Safety & Image
                </h3>
                <hr className="mb-4 border-[#2E0854]" />

                <label className="block mb-1 font-medium">
                  Product Image{" "}
                  {isEditing ? (
                    "(leave blank to keep)"
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleChange}
                  hidden
                  id="imageUpload"
                />
                <div className="flex flex-col items-center relative">
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("imageUpload").click()
                    }
                    className="bg-[#FFCC00] hover:bg-yellow-300 text-[#2E0854] px-4 py-2 
                    rounded-lg font-medium transition mb-1"
                  >
                    Upload Image
                  </button>
                  <p className="text-sm text-gray-500 mb-2">
                    Only JPG/PNG, max 5MB
                  </p>
                  {!isEditing && errors.image && (
                    <p className="text-sm text-red-500">Required</p>
                  )}

                  {preview && preview.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {preview.map((src, index) => (
                        <div key={index} className="relative">
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            className="w-60 h-60 object-cover border-2 border-black rounded-lg shadow"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleImageReset}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 rounded-full"
                      >
                        ✕ Clear All
                      </button>
                    </div>
                  )}
                </div>

                <label className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    name="allowRecording"
                    checked={product.allowRecording}
                    onChange={handleChange}
                  />
                  <span>
                    Allow photo/video recording during meetup for safety
                    <span className="text-gray-500 text-sm">(Optional)</span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${
                  isSubmitting
                    ? "bg-gray-400"
                    : "bg-[#2E0854] hover:bg-purple-900"
                } text-white py-3 rounded-lg font-semibold transition`}
              >
                {isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Submitting..."
                  : isEditing
                  ? "Save Changes"
                  : "Submit Product"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}