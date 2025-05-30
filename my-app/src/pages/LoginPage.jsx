function LoginPage() {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Login</h2>
        <form>
          <input type="email" placeholder="Email" style={{ display: 'block', margin: '1rem 0' }} />
          <input type="password" placeholder="Password" style={{ display: 'block', margin: '1rem 0' }} />
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }
  
  export default LoginPage
  