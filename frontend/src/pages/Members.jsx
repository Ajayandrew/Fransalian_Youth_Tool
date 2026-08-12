import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemberIDCardModal from '../components/MemberIDCardModal';
import MemberProfileModal from '../components/MemberProfileModal';
import PhotoLightboxModal from '../components/PhotoLightboxModal';
import { getImageUrl } from '../utils/urlUtils';
import {
  Users,
  Search,
  Plus,
  Grid,
  List,
  FileSpreadsheet,
  QrCode,
  Edit,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Upload,
  Trash,
  Eye,
  Download,
  Droplet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useDataCache } from '../context/DataContext';
import { useSearchParams } from 'react-router-dom';

export default function Members() {
  const { user, hasRole, updateUserRole } = useAuth();
  const { settings } = useSettings();
  const { fetchWithCache, invalidateCache } = useDataCache();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genderFilter, setGenderFilter] = useState('');
  const [anbiyamFilter, setAnbiyamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedIDCardMember, setSelectedIDCardMember] = useState(null);
  const [selectedProfileMember, setSelectedProfileMember] = useState(null);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    baptismName: '',
    gender: 'Male',
    dob: '2000-01-01',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    address: '',
    city: settings.city || 'Chennai',
    district: settings.district || 'Chennai',
    state: settings.state || 'Tamil Nadu',
    pincode: settings.pincode || '600004',
    occupation: '',
    bloodGroup: 'O+',
    maritalStatus: 'Single',
    anbiyamName: 'Sagaya Madha Anbiyam',
    parish: settings.churchName || 'St. Mary Cathedral',
    joinedYouthDate: new Date().toISOString().split('T')[0],
    activeStatus: 'Active',
    role: 'Youth Member',
    photo: '',
    notes: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const canEdit = user?.role === 'Admin' || user?.role === 'Youth Leader' || user?.role === 'Secretary';

  const handleRoleChange = async (memberId, newRole) => {
    if (user?.role !== 'Admin') {
      return toast.error('Only System Admin / Pastor can change key office bearer roles.');
    }
    try {
      const res = await axios.put(`/api/members/${memberId}`, { role: newRole });
      if (res.data && res.data.success) {
        toast.success(`Role updated to ${newRole}`);
        invalidateCache('members');
        invalidateCache('dashboard');
        fetchMembers();
      }
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  const fetchMembers = async (isInitial = false) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (genderFilter && genderFilter !== 'All') params.gender = genderFilter;
      if (anbiyamFilter && anbiyamFilter !== 'All') params.anbiyam = anbiyamFilter;
      if (statusFilter && statusFilter !== 'All') params.activeStatus = statusFilter;

      const data = await fetchWithCache('members', '/api/members', params);
      if (data && (data.members || Array.isArray(data))) {
        setMembers(Array.isArray(data) ? data : data.members || []);
      }
    } catch (err) {
      console.error('Failed to load youth members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, genderFilter, anbiyamFilter, statusFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'new' && canEdit) {
      handleOpenNewModal();
    }
  }, [searchParams]);

  const handleOpenNewModal = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      baptismName: '',
      gender: 'Male',
      dob: '2000-01-01',
      mobileNumber: '',
      whatsappNumber: '',
      email: '',
      address: '',
      city: settings.city || 'Chennai',
      district: settings.district || 'Chennai',
      state: settings.state || 'Tamil Nadu',
      pincode: settings.pincode || '600004',
      occupation: '',
      bloodGroup: 'O+',
      maritalStatus: 'Single',
      anbiyamName: 'Sagaya Madha Anbiyam',
      parish: settings.churchName || 'St. Mary Cathedral',
      joinedYouthDate: new Date().toISOString().split('T')[0],
      activeStatus: 'Active',
      role: 'Youth Member',
      photo: '',
      notes: ''
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setShowModal(true);
  };

  const handleOpenPhotoLightbox = (m) => {
    setSelectedLightboxPhoto({
      url: getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600',
      title: m.fullName,
      subtitle: `${m.anbiyamName || 'Parish Member'} ${m.baptismName ? '• Baptism: ' + m.baptismName : ''}`
    });
  };

  const handleEdit = (m) => {
    setEditingMember(m);
    setFormData({ ...m });
    setPhotoFile(null);
    setPhotoPreview(getImageUrl(m.photo) || '');
    setShowModal(true);
  };

  const handleRemovePhoto = async (memberId) => {
    if (!window.confirm('Remove profile photo for this member?')) return;
    try {
      const res = await axios.put(`/api/members/${memberId}`, { removePhoto: 'true' });
      if (res.data && res.data.success) {
        toast.success('Photo removed.');
        setPhotoPreview('');
        setFormData(prev => ({ ...prev, photo: '' }));
        fetchMembers();
      }
    } catch (err) {
      toast.error('Failed to remove photo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member record?')) return;
    try {
      const res = await axios.delete(`/api/members/${id}`);
      if (res.data && res.data.success) {
        toast.success('Member removed.');
        invalidateCache('members');
        invalidateCache('dashboard');
        fetchMembers();
      }
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.fullName || formData.fullName.trim().length === 0) {
      return toast.error('Full Name is mandatory.');
    }
    if (formData.fullName.trim().length > 50) {
      return toast.error('Full Name cannot exceed 50 characters.');
    }
    if (formData.baptismName && formData.baptismName.trim().length > 50) {
      return toast.error('Baptism Name cannot exceed 50 characters.');
    }
    if (!formData.mobileNumber || !/^\d{10}$/.test(formData.mobileNumber.trim())) {
      return toast.error('Mobile Number is mandatory and must be exactly 10 numeric digits.');
    }
    if (formData.address && formData.address.trim().length > 150) {
      return toast.error('Address cannot exceed 150 characters.');
    }

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => {
        if (['_id', 'createdAt', 'updatedAt', '__v', 'photo'].includes(key)) return;
        const val = formData[key];
        if (val !== null && val !== undefined) {
          formPayload.append(key, val);
        }
      });
      if (photoFile) {
        formPayload.append('photo', photoFile);
      }

      if (editingMember) {
        const res = await axios.put(`/api/members/${editingMember._id}`, formPayload);
        if (res.data && res.data.success) {
          toast.success('Member profile updated!');
          setShowModal(false);
          setPhotoFile(null);
          setPhotoPreview('');
          if (selectedProfileMember && selectedProfileMember._id === editingMember._id) {
            setSelectedProfileMember(res.data.member);
          }
          invalidateCache('members');
          invalidateCache('dashboard');
          fetchMembers();
        }
      } else {
        const res = await axios.post('/api/members', formPayload);
        if (res.data && res.data.success) {
          toast.success('Youth member registered!');
          setShowModal(false);
          setPhotoFile(null);
          setPhotoPreview('');
          invalidateCache('members');
          invalidateCache('dashboard');
          fetchMembers();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save member.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Youth Members Directory</h1>
          <p className="text-xs text-slate-500 font-medium">Manage member profiles, blood groups, photos, contact numbers, and ID badges</p>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              onClick={handleOpenNewModal}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, blood group, mobile, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'table' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-bold text-xs tracking-wide">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2.5" />
          <span>Loading...</span>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div key={m._id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative group/photo cursor-pointer" onClick={() => handleOpenPhotoLightbox(m)}>
                      <img
                        src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300'}
                        alt={m.fullName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300';
                        }}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 group-hover/photo:opacity-90 transition"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover/photo:opacity-100 transition flex items-center justify-center text-white">
                        <Download className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 hover:text-indigo-600 transition cursor-pointer" onClick={() => setSelectedProfileMember(m)}>
                          {m.fullName}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-black font-mono rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {m.memberId || 'FY-MEM-001'}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-600 font-bold">{m.baptismName ? `(${m.baptismName})` : ''} • Age: {m.age}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {canAssignRole ? (
                          <select
                            value={m.role || 'Youth Member'}
                            onChange={(e) => handleRoleChange(m._id, e.target.value)}
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 focus:outline-none cursor-pointer"
                            title="Click to assign or change role"
                          >
                            <option value="Youth Member">Youth Member</option>
                            <option value="Youth Leader">Youth Leader</option>
                            <option value="Vice President">Vice President</option>
                            <option value="Treasurer">Treasurer</option>
                            <option value="Secretary">Secretary</option>
                            <option value="Joint Secretary">Joint Secretary</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            {m.role || 'Youth Member'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-0.5">
                          <Droplet className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                          {m.bloodGroup || 'O+'}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-700">
                          {m.anbiyamName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${m.activeStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {m.activeStatus}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.mobileNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{m.email || 'No Email'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{m.city || 'Chennai'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedProfileMember(m)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => setSelectedIDCardMember(m)}
                    className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center space-x-1 transition"
                    title="ID Badge"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Badge</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  {canEdit && (
                    <button onClick={() => handleEdit(m)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition" title="Edit Profile & Photo">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canEdit && m.photo && (
                    <button onClick={() => handleRemovePhoto(m._id)} className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition" title="Remove Photo">
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(m._id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition" title="Delete Member">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Member ID</th>
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Youth Role</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Gender / Age</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Anbiyam</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map(m => (
                  <tr key={m._id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-black text-indigo-700">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
                        {m.memberId || 'FY-MEM-001'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 flex items-center space-x-3">
                      <img
                        src={getImageUrl(m.photo) || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100'}
                        alt={m.fullName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100';
                        }}
                        className="w-9 h-9 rounded-xl object-cover cursor-pointer hover:opacity-80"
                        onClick={() => handleOpenPhotoLightbox(m)}
                      />
                      <span className="hover:text-indigo-600 cursor-pointer" onClick={() => setSelectedProfileMember(m)}>{m.fullName}</span>
                    </td>
                    <td className="p-4">
                      {canAssignRole ? (
                        <select
                          value={m.role || 'Youth Member'}
                          onChange={(e) => handleRoleChange(m._id, e.target.value)}
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 focus:outline-none cursor-pointer"
                          title="Assign Role"
                        >
                          <option value="Youth Member">Youth Member</option>
                          <option value="Youth Leader">Youth Leader</option>
                          <option value="Vice President">Vice President</option>
                          <option value="Treasurer">Treasurer</option>
                          <option value="Secretary">Secretary</option>
                          <option value="Joint Secretary">Joint Secretary</option>
                          <option value="Admin">Admin</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          {m.role || 'Youth Member'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-rose-600 fill-rose-600" />
                        {m.bloodGroup || 'O+'}
                      </span>
                    </td>
                    <td className="p-4">{m.gender} ({m.age} yrs)</td>
                    <td className="p-4">{m.mobileNumber}</td>
                    <td className="p-4">{m.anbiyamName}</td>
                    <td className="p-4 font-bold text-emerald-600">{m.activeStatus}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setSelectedProfileMember(m)} className="p-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-100">View Profile</button>
                      <button onClick={() => setSelectedIDCardMember(m)} className="p-1.5 rounded-lg text-indigo-600 font-bold hover:bg-indigo-50">Badge</button>
                      {canEdit && <button onClick={() => handleEdit(m)} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">Edit</button>}
                      {canDelete && <button onClick={() => handleDelete(m._id)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Member Profile & Photo' : 'Register New Member'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={photoPreview || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200'}
                    alt="Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200';
                    }}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-300 cursor-pointer"
                    onClick={() => {
                      if (photoPreview) setSelectedLightboxPhoto({ url: photoPreview, title: formData.fullName || 'Photo' });
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">Profile Photo</h4>
                    <p className="text-[11px] text-slate-500">Upload new image or remove photo</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                  </label>

                  {editingMember && editingMember._id && photoPreview && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(editingMember._id)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold border border-rose-200 flex items-center space-x-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name (Max 50 chars) *</label>
                  <input type="text" required maxLength={50} value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Enter full name (max 50 chars)" className="white-input" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Baptism Name (Max 50 chars)</label>
                  <input type="text" maxLength={50} value={formData.baptismName} onChange={(e) => setFormData({ ...formData, baptismName: e.target.value })} placeholder="Enter baptism name (max 50 chars)" className="white-input" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                    <span>Blood Group *</span>
                  </label>
                  <select
                    value={formData.bloodGroup || 'O+'}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="white-input font-bold"
                  >
                    {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>🩸 {bg} Blood Group</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender *</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="white-input">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Birth *</label>
                  <input type="date" required value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="white-input" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number (10 Digits) *</label>
                  <input type="text" required maxLength={10} value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '') })} placeholder="Enter 10 digit mobile number" className="white-input" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Youth Association Role / Designation *</label>
                  <select
                    value={formData.role || 'Youth Member'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="white-input font-bold text-indigo-700 bg-indigo-50/50 border-indigo-200"
                  >
                    <option value="Youth Member">Youth Member</option>
                    <option value="Youth Leader">Youth Leader (President)</option>
                    <option value="Vice President">Vice President</option>
                    <option value="Treasurer">Treasurer (Accounts)</option>
                    <option value="Secretary">Secretary (Records)</option>
                    <option value="Joint Secretary">Joint Secretary</option>
                    <option value="Admin">Super Admin / Pastor</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Anbiyam Name</label>
                  <select value={formData.anbiyamName} onChange={(e) => setFormData({ ...formData, anbiyamName: e.target.value })} className="white-input">
                    <option value="Sagaya Madha Anbiyam">Sagaya Madha Anbiyam</option>
                    <option value="Vinnarasi Madha Anbiyam">Vinnarasi Madha Anbiyam</option>
                    <option value="Iruthaiya Aandaver Anbiyam">Iruthaiya Aandaver Anbiyam</option>
                    <option value="Anthoniyar Anbiyam">Anthoniyar Anbiyam</option>
                    <option value="Amalorpava Madha Anbiyam">Amalorpava Madha Anbiyam</option>
                    <option value="Saleth Madha Anbiyam">Saleth Madha Anbiyam</option>
                    <option value="Arockiya Matha Anbiyam">Arockiya Matha Anbiyam</option>
                    <option value="Susaiyappar Anbiyam">Susaiyappar Anbiyam</option>
                    <option value="Kulanthai Yeasu Anbiyam">Kulanthai Yeasu Anbiyam</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="py-2.5 px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-md">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview & Download Modal */}
      {selectedLightboxPhoto && (
        <PhotoLightboxModal
          photoUrl={selectedLightboxPhoto.url}
          title={selectedLightboxPhoto.title}
          subtitle={selectedLightboxPhoto.subtitle}
          onClose={() => setSelectedLightboxPhoto(null)}
          onViewProfile={selectedLightboxPhoto.member ? () => {
            setSelectedProfileMember(selectedLightboxPhoto.member);
            setSelectedLightboxPhoto(null);
          } : null}
        />
      )}

      {/* Full Profile Details Modal */}
      {selectedProfileMember && (
        <MemberProfileModal
          member={selectedProfileMember}
          onClose={() => setSelectedProfileMember(null)}
          onOpenIDBadge={(m) => setSelectedIDCardMember(m)}
        />
      )}

      {/* ID Badge Modal */}
      {selectedIDCardMember && (
        <MemberIDCardModal
          member={selectedIDCardMember}
          onClose={() => setSelectedIDCardMember(null)}
        />
      )}

      {/* Member Photo Lightbox Modal */}
      {selectedLightboxPhoto && (
        <PhotoLightboxModal
          photoUrl={selectedLightboxPhoto.url}
          title={selectedLightboxPhoto.title}
          subtitle={selectedLightboxPhoto.subtitle}
          onClose={() => setSelectedLightboxPhoto(null)}
          onViewProfile={() => {
            const mem = members.find(m => m.fullName === selectedLightboxPhoto.title);
            if (mem) setSelectedProfileMember(mem);
            setSelectedLightboxPhoto(null);
          }}
        />
      )}
    </div>
  );
}
