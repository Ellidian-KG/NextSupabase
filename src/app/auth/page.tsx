"use client"
import styles from './Auth.module.css';
import { useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { useRouter } from 'next/navigation';
const RegistrationForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
  
    if (userError) {
      setError(userError.message);
      return; 
    }
  
    if (userData.length > 0) {
      setError('Пользователь с таким email уже существует.');
      return; 
    }
 
    const { data: newUserData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signupError) {
      setError(signupError.message);
    } else {
      setSuccess('Регистрация прошла успешно! Пожалуйста, проверьте ваш email для подтверждения.');
      router.push('/login'); 
    }
  };

  return (
    <div className={styles.container}>
    <form onSubmit={handleRegister}>
      <div className={styles['form-container']}>
      <h2>Регистрация</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Зарегистрироваться</button>
      </div>
    </form>
    </div>
  );
};

export default RegistrationForm;
