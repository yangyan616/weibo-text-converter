import React from 'react';
import './App.css';
import WeiboConverter from './components/WeiboConverter';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Weibo Text Converter</h1>
      </header>
      <main>
        <WeiboConverter />
      </main>
      <footer>
        <p>Convert Weibo emojis to standard emojis for cross-platform sharing</p>
      </footer>
    </div>
  );
}

export default App;
