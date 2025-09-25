import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/base/buttons/button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark-mode:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-green-600 mb-2">
            Group Pay
          </h1>
          <h2 className="text-center text-2xl font-bold text-neutral-900 dark-mode:text-neutral-50">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark-mode:text-neutral-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark-mode:border-neutral-600 rounded-md shadow-sm bg-white dark-mode:bg-neutral-800 text-neutral-900 dark-mode:text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark-mode:text-neutral-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark-mode:border-neutral-600 rounded-md shadow-sm bg-white dark-mode:bg-neutral-800 text-neutral-900 dark-mode:text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              isLoading={isLoading}
              color="primary"
              className="w-full flex justify-center py-2 px-4"
            >
              Sign in
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-neutral-600 dark-mode:text-neutral-400">
          Don't have an account?{' '}
          <a
            href="#"
            className="font-medium text-green-600 hover:text-green-500"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
