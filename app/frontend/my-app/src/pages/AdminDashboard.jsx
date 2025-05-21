import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import config from "../config";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Users, Package, Flag, ChevronDown, ChevronUp } from "lucide-react";

const AdminDashboard = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    products_by_status: [],
    reports_by_status: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== "admin") {
      toast.error("Admin access required");
      navigate("/");
      return;
    }

    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Get pending products
      const productsResponse = await axios.get(
        `${config.apiUrl}/admin/products/pending`, 
        { headers }
      );
      setPendingProducts(productsResponse.data);

      // Get dashboard stats
      const statsResponse = await axios.get(
        `${config.apiUrl}/admin/dashboard`, 
        { headers }
      );
      setStats(statsResponse.data);

      // Get users
      const usersResponse = await axios.get(
        `${config.apiUrl}/auth/users`, 
        { headers }
      );
      setUsers(usersResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
      setLoading(false);
    }
  };

  const handleApproval = async (productId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${config.apiUrl}/admin/products/${productId}/moderate`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success(
        status === 'approved' 
          ? "Product approved and published" 
          : "Product rejected"
      );
      
      // Remove the product from the list
      setPendingProducts(pendingProducts.filter(p => p.product_id !== productId));
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    }
  };

  const toggleProductDetails = (productId) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
    }
  };

  const handleUserStatusUpdate = async (userId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${config.apiUrl}/auth/users/${userId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success(`User status updated to ${status}`);
      
      // Update user in the list
      setUsers(users.map(user => 
        user.user_id === userId ? {...user, account_status: status} : user
      ));
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <motion.h1 
            className="text-3xl font-bold text-center text-[#2E0854] mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Admin Dashboard
          </motion.h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-600">Loading admin data...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <motion.h1 
          className="text-3xl font-bold text-center text-[#2E0854] mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Admin Dashboard
        </motion.h1>
        <div className="flex justify-center mb-8">
          <div className="h-1 w-24 bg-[#FFCC00] rounded-full"></div>
        </div>

        {/* Dashboard Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#2E0854]">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-[#2E0854] mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-[#2E0854]">{stats.total_users}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#FFCC00]">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-[#FFCC00] mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Pending Products</p>
                <p className="text-2xl font-bold text-[#2E0854]">
                  {pendingProducts.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center">
              <Flag className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Open Reports</p>
                <p className="text-2xl font-bold text-[#2E0854]">
                  {stats.reports_by_status?.find(r => r.status === 'pending')?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "pending" ? "text-[#2E0854] border-b-2 border-[#2E0854]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Products
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "users" ? "text-[#2E0854] border-b-2 border-[#2E0854]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("users")}
          >
            User Management
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "reports" ? "text-[#2E0854] border-b-2 border-[#2E0854]" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "pending" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#2E0854]">Products Awaiting Approval</h2>
              <button 
                onClick={fetchAdminData}
                className="px-4 py-2 bg-[#FFCC00] text-[#2E0854] rounded-full text-sm font-medium hover:bg-yellow-300 transition"
              >
                Refresh
              </button>
            </div>
            
            {pendingProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No pending products to review.</p>
                <p className="text-gray-400 text-sm mt-2">All products have been reviewed!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingProducts.map((product) => (
                  <motion.div 
                    key={product.product_id} 
                    className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-100 hover:border-[#2E0854] transition-all"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={
                          product.images?.[0]
                            ? product.images[0].startsWith("/")
                              ? `${config.apiUrl}${product.images[0]}`
                              : product.images[0]
                            : "/default-product.png"
                        }
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 text-[#2E0854]">{product.name}</h3>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-600 text-sm">
                          By {product.seller_username}
                        </p>
                        <p className="font-bold text-[#2E0854]">${product.price}</p>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {product.description}
                        </p>
                        <button 
                          onClick={() => toggleProductDetails(product.product_id)}
                          className="text-sm text-[#2E0854] font-medium mt-1 flex items-center"
                        >
                          {expandedProduct === product.product_id ? (
                            <>Show Less <ChevronUp size={16} className="ml-1" /></>
                          ) : (
                            <>Show More <ChevronDown size={16} className="ml-1" /></>
                          )}
                        </button>
                      </div>
                      
                      {expandedProduct === product.product_id && (
                        <div className="my-3 p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="mb-1"><span className="font-medium">Condition:</span> {product.condition}</p>
                          <p className="mb-1"><span className="font-medium">Category:</span> {product.category_id}</p>
                          <p className="mb-1"><span className="font-medium">Listed:</span> {new Date(product.created_at).toLocaleDateString()}</p>
                          <p><span className="font-medium">Full Description:</span> {product.description}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={() => handleApproval(product.product_id, "approved")}
                          className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition"
                        >
                          <CheckCircle size={16} className="mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleApproval(product.product_id, "rejected")}
                          className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition"
                        >
                          <XCircle size={16} className="mr-1" /> Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-[#2E0854]">User Management</h2>
                <p className="text-gray-500 text-sm">Manage user accounts and permissions</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#2E0854] rounded-full flex items-center justify-center text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.first_name} {user.last_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.user_role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                              user.user_role === 'moderator' ? 'bg-blue-100 text-blue-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {user.user_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.account_status === 'active' ? 'bg-green-100 text-green-800' : 
                              user.account_status === 'inactive/banned' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {user.account_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.account_status === 'active' ? (
                            <button 
                              onClick={() => handleUserStatusUpdate(user.user_id, 'inactive/banned')}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserStatusUpdate(user.user_id, 'active')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Activate
                            </button>
                          )}
                          <a href={`/user/${user.user_id}`} className="text-[#2E0854] hover:text-purple-900">
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "reports" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-xl font-semibold text-[#2E0854] mb-4">Report Management</h2>
              <p className="text-gray-500">Report management panel is coming soon!</p>
              <p className="text-gray-400 text-sm mt-2">This feature is currently under development.</p>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
