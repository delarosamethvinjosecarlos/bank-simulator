import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

interface User {
  username: string;
  account_iban: string;
  balance: number;
}

interface Message {
  text: string;
  type: 'success' | 'error' | '';
}

type ViewState = 'login' | 'register' | 'dashboard';

function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [view, setView] = useState<ViewState>(token ? 'dashboard' : 'login');
  
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [msg, setMsg] = useState<Message>({ text: '', type: '' });

  const [ibanDestino, setIbanDestino] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    if (token) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get<User>(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setView('dashboard');
    } catch (e) {
      logout();
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      const newToken = res.data.access_token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setMsg({ text: '', type: '' });
    } catch (e) {
      setMsg({ text: 'Credenciales inválidas', type: 'error' });
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, { username, password });
      setMsg({ text: 'Registro exitoso. Inicia sesión.', type: 'success' });
      setView('login');
    } catch (e) {
      setMsg({ text: 'El usuario ya existe', type: 'error' });
    }
  };

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/transferencias`, {
        iban_destino: ibanDestino,
        amount: parseFloat(amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ text: res.data.message, type: 'success' });
      fetchUser(); // refresh balance
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || 'Error en transferencia', type: 'error' });
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    setView('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-primary">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">Bank Simulator</h1>
        
        {msg.text && (
          <div className={`p-3 mb-4 rounded ${msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {msg.text}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-lg font-semibold">Iniciar Sesión</h2>
            <input type="text" placeholder="Usuario" className="w-full border p-2 rounded" value={username} onChange={e => setUsername(e.target.value)} required data-cy="login-user" />
            <input type="password" placeholder="Contraseña" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} required data-cy="login-pass" />
            <button type="submit" className="w-full bg-secondary text-white p-2 rounded hover:bg-primary transition" data-cy="login-btn">Entrar</button>
            <p className="text-sm text-center">¿No tienes cuenta? <button type="button" onClick={() => {setView('register'); setMsg({text:'', type:''});}} className="text-accent underline" data-cy="go-register">Regístrate</button></p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-lg font-semibold">Registro</h2>
            <input type="text" placeholder="Usuario" className="w-full border p-2 rounded" value={username} onChange={e => setUsername(e.target.value)} required data-cy="reg-user" />
            <input type="password" placeholder="Contraseña" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} required data-cy="reg-pass" />
            <button type="submit" className="w-full bg-secondary text-white p-2 rounded hover:bg-primary transition" data-cy="reg-btn">Crear Cuenta</button>
            <p className="text-sm text-center">¿Ya tienes cuenta? <button type="button" onClick={() => {setView('login'); setMsg({text:'', type:''});}} className="text-accent underline">Inicia Sesión</button></p>
          </form>
        )}

        {view === 'dashboard' && user && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-700">Hola, {user.username}</span>
              <button onClick={logout} className="text-sm text-red-500 hover:underline" data-cy="logout-btn">Cerrar Sesión</button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border">
              <p className="text-sm text-gray-500">Saldo Disponible</p>
              <p className="text-3xl font-bold text-primary" data-cy="balance">{user.balance.toFixed(2)} €</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{user.account_iban}</p>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <h3 className="font-semibold text-secondary">Nueva Transferencia (FR, DE, IT)</h3>
              <input type="text" placeholder="IBAN Destino" className="w-full border p-2 rounded uppercase" value={ibanDestino} onChange={e => setIbanDestino(e.target.value)} required data-cy="transfer-iban" />
              <input type="number" step="0.01" min="1" placeholder="Importe (€)" className="w-full border p-2 rounded" value={amount} onChange={e => setAmount(e.target.value)} required data-cy="transfer-amount" />
              <button type="submit" className="w-full bg-secondary text-white p-2 rounded hover:bg-primary transition" data-cy="transfer-btn">Enviar Dinero</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;