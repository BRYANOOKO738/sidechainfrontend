import { useState } from 'react'
import  'react-bootstrap-icons';
import {ethers} from 'ethers';
import TokenABI from './abis/SidechainToken.json';
import BridgeABI from './abis/TokenBridge.json';

const TOKEN_ADDRESS = '0xCA838eaF74669ba0E01a53e2f5F84A6A0beCa294';
const BRIDGE_ADDRESS = '0xb4cfbE11383e18710093d6107524DE608Ff8aDC5';

function App() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  
  
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeDirection, setBridgeDirection] = useState('lock'); 


  const [tokenContract, setTokenContract] = useState(null);
  const [bridgeContract, setBridgeContract] = useState(null);

  const connectWallet = async () => {
    try {
      setLoading(true);
      
  
     
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }
  
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  
      
      const account = accounts[0];
  
     
      
      setAccount(account);
  
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
    
  
      
      const token = new ethers.Contract(TOKEN_ADDRESS, TokenABI, provider);
      const bridge = new ethers.Contract(BRIDGE_ADDRESS, BridgeABI, provider);
      setTokenContract(token);
      setBridgeContract(bridge);
      
   console.log("clicking")
      
      await refreshBalance(token, account);
    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const refreshBalance = async (token, account) => {
    try {
      const balance = await token.balanceOf(account);
      console.log('Balance:', balance.toString()); 
      setBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    }
  };
  

  const handleTransfer = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const tx = await tokenContract.transfer(
        recipient,
        ethers.utils.parseEther(amount)
      );
      await tx.wait();
      
      setSuccess('Transfer successful!');
      await refreshBalance(tokenContract, account);
      setAmount('');
      setRecipient('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const amountInWei = ethers.utils.parseEther(bridgeAmount);
      const transferId = ethers.utils.id(Date.now().toString());

      if (bridgeDirection === 'lock') {
        const approveTx = await tokenContract.approve(BRIDGE_ADDRESS, amountInWei);
        await approveTx.wait();

        const tx = await bridgeContract.lockTokens(
          TOKEN_ADDRESS,
          amountInWei,
          transferId
        );
        await tx.wait();
      } else {
        const signature = '0x...';
        const tx = await bridgeContract.unlockTokens(
          TOKEN_ADDRESS,
          account,
          amountInWei,
          transferId,
          signature
        );
        await tx.wait();
      }

      setSuccess('Bridge operation successful!');
      await refreshBalance(tokenContract, account);
      setBridgeAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container mt-5">
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Bor Sidechain DApp</span>
          {!account ? (
            <button onClick={connectWallet} disabled={loading} className="btn btn-primary">
              
              <i className="bi bi-wallet2 me-2"></i>
              Connect Wallet
            </button>
          ) : (
            <div className="text-muted btn btn-warning">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </div>

        
          <div className="card-body">
            <div className="mb-4">
              <div className="text-muted">Balance</div>
              <div className="fs-3 fw-bold">{balance} MATIC</div>
            </div>

            <ul className="nav nav-tabs" id="myTab" role="tablist">
              <li className="nav-item" role="presentation">
                <a className="nav-link active" id="transfer-tab" data-bs-toggle="tab" href="#transfer" role="tab" aria-controls="transfer" aria-selected="true">Transfer</a>
              </li>
              <li className="nav-item" role="presentation">
                <a className="nav-link" id="bridge-tab" data-bs-toggle="tab" href="#bridge" role="tab" aria-controls="bridge" aria-selected="false">Bridge</a>
              </li>
            </ul>

            <div className="tab-content mt-4" id="myTabContent">
              <div className="tab-pane fade show active" id="transfer" role="tabpanel" aria-labelledby="transfer-tab">
                <div className="mb-3">
                  <label className="form-label">Recipient</label>
                  <input
                    type="text"
                    className="form-control"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.000000000000000001"
                  />
                </div>

                <button 
                  onClick={handleTransfer} 
                  disabled={loading || !recipient || !amount} 
                  className="btn btn-success w-100"
                >
                  {loading ? (
                    <p className="me-2 spinner-border" ></p>
                  ) : (
                    
                    <i class="bi bi-arrow-down-up me-2"></i>
                  )}
                  Transfer
                </button>
              </div>

              <div className="tab-pane fade" id="bridge" role="tabpanel" aria-labelledby="bridge-tab">
                <div className="mb-3">
                  <label className="form-label">Bridge Direction</label>
                  <div className="btn-group w-100" role="group" aria-label="Bridge Direction">
                    <button
                      type="button"
                      className={`btn ${bridgeDirection === 'lock' ? 'btn-primary' : 'btn-outline-primary'} w-50`}
                      onClick={() => setBridgeDirection('lock')}
                    >
                      Lock
                    </button>
                    <button
                      type="button"
                      className={`btn ${bridgeDirection === 'unlock' ? 'btn-primary' : 'btn-outline-primary'} w-50`}
                      onClick={() => setBridgeDirection('unlock')}
                    >
                      Unlock
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.000000000000000001"
                  />
                </div>

                <button 
                  onClick={handleBridge} 
                  disabled={loading || !bridgeAmount} 
                  className="btn btn-warning w-100"
                >
                  {loading ? (
                    
                    <p className="me-2 spinner-border" ></p>
                  ) : (
                    
                    <i class="bi bi-bricks me-2"></i>
                  )}
                  {bridgeDirection === 'lock' ? 'Lock Tokens' : 'Unlock Tokens'}
                </button>
              </div>
            </div>

          

            {success && (
              <div className="alert alert-success mt-4">
                {success}
              </div>
            )}
          </div>
        
      </div>
    </div>
    </>
  )
}

export default App
