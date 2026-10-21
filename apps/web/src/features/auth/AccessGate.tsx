import { FormEvent } from 'react';

type AccessGateProps = {
  hasCredentials: boolean;
  hasChurch: boolean;
  registrationMode: boolean;
  registrationSuccess: string;
  loginError: string;
  pageError: string;
  isLoading: boolean;
  isSaving: boolean;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
  onSignUp: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitChurch: (event: FormEvent<HTMLFormElement>) => void;
  onToggleRegistration: () => void;
};

export function AccessGate({
  hasCredentials,
  hasChurch,
  registrationMode,
  registrationSuccess,
  loginError,
  pageError,
  isLoading,
  isSaving,
  onSignIn,
  onSignUp,
  onSubmitChurch,
  onToggleRegistration,
}: AccessGateProps) {
  if (!hasCredentials) {
    return (
      <section className="login-view" aria-labelledby="login-title">
        <div className="login-heading">
          <p className="eyebrow">Church administrator access</p>
          <h1 id="login-title">{registrationMode ? 'Create your account' : 'Election setup'}</h1>
          <p className="intro">{registrationMode ? 'Create an account to get started.' : 'Sign in to configure your church elections.'}</p>
        </div>
        <form className="login-form" onSubmit={registrationMode ? onSignUp : onSignIn}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete={registrationMode ? 'new-password' : 'current-password'} required minLength={registrationMode ? 8 : undefined} maxLength={registrationMode ? 72 : undefined} />
          {registrationMode && <p className="form-note">Use 8 to 72 characters for your password.</p>}
          {loginError && <p className="error-message" role="alert">{loginError}</p>}
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? (registrationMode ? 'Creating account…' : 'Checking access…') : registrationMode ? 'Create account' : 'Sign in'}
          </button>
          {registrationSuccess && <p className="state-message" role="status">{registrationSuccess}</p>}
          <button className="text-button" type="button" onClick={onToggleRegistration}>
            {registrationMode ? 'Already have an account? Sign in' : 'Create an account'}
          </button>
          <p className="form-note">Credentials are held in memory only for this session.</p>
        </form>
      </section>
    );
  }

  if (!hasChurch) {
    return (
      <section className="login-view" aria-labelledby="church-title">
        <div className="login-heading">
          <p className="eyebrow">Church administration</p>
          <h1 id="church-title">Register your church</h1>
          <p className="intro">Your account is ready. Add a church to begin election setup.</p>
        </div>
        {pageError && <p className="error-message page-error" role="alert">{pageError}</p>}
        <form className="login-form" onSubmit={onSubmitChurch}>
          <label htmlFor="church-name">Church name</label>
          <input id="church-name" name="churchName" required maxLength={160} />
          <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Registering…' : 'Register church'}</button>
        </form>
      </section>
    );
  }

  return null;
}