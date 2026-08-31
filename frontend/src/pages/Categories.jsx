import { useEffect, useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', { name });
      setSuccess('Category created');
      setName('');
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <Button onClick={() => setModalOpen(true)}>+ Add Category</Button>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {categories.map((c) => (
              <div key={c._id} className="bg-gray-50 rounded-lg p-4 text-center font-medium text-gray-700">
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Category">
        <form onSubmit={handleSubmit}>
          <Input label="Category Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
