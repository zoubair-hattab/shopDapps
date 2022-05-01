import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";
import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();

      if (provider) {
        providerChanged(provider);
        setWeb3Api({
          provider,
          web3: new Web3(provider),
        });
      } else {
        window.alert("Please Install Metamask wallet or other");
      }
    };
    loadProvider();
  }, []);

  const [account, setAccount] = useState(null);
  useEffect(() => {
    const loadAccounts = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };
    web3Api.web3 && loadAccounts();
  }, [web3Api.web3]);

  const providerChanged = (provider) => {
    provider.on("accountsChanged", (_) => window.location.reload());
    provider.on("chainChanged", (_) => window.location.reload());
  };
  //Load Contract
  const [contract, setContract] = useState();
  const [productsCount, setProductsCount] = useState();
  useEffect(() => {
    const loadContracts = async () => {
      const contractFile = await fetch("/abis/Shop.json");
      const convertToJson = await contractFile.json();
      //find the abi
      const abi = convertToJson.abi;

      const netWorkid = await web3Api.web3.eth.net.getId();

      const networkObject = convertToJson.networks[netWorkid];

      if (networkObject) {
        const contractAddress = convertToJson.networks[netWorkid].address;
        const deployedContract = await new web3Api.web3.eth.Contract(
          abi,
          contractAddress
        );
        setContract(deployedContract);

        const producCount = await deployedContract.methods.count().call();
        setProductsCount(producCount);
      } else {
        window.alert("Please connect your wallet with Ropsten  Network");
      }
    };
    web3Api.web3 && loadContracts();
  }, [web3Api.web3]);
  const [productInputs, setProductInputs] = useState({
    name: "",
    price: "",
    description: "",
  });
  //Add Product
  const addProduct = async () => {
    const value = productInputs.price;
    const converTowei = Web3.utils.toWei(value, "ether");
    if (productInputs.name && converTowei && productInputs.description) {
      const addProduct = await contract.methods
        .createShopProduct(
          productInputs.name,
          converTowei,
          productInputs.description
        )
        .send({ from: account });

      window.location.reload();
    } else {
      window.alert("Please fill all inputs");
    }
  };

  const [products, setLoadedProducts] = useState([]);
  const [productsSold, setLoadedSoldProducts] = useState([]);
  useEffect(() => {
    const loadProducts = async () => {
      for (let i = 1; i <= productsCount; i++) {
        const product = await contract.methods.shopProducts(i).call();
        if (product.sold === false) {
          setLoadedProducts((products) => [...products, product]);
        } else {
          setLoadedSoldProducts((productsSold) => [...productsSold, product]);
        }
      }
      setLoading(false);
    };
    productsCount && loadProducts();
  }, [productsCount]);

  console.log(products);
  const buyProduct = (id, price) => {
    contract.methods
      .purchasedShopProduct(id)
      .send({ from: account, value: price });
  };

  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand">Zoubair Shop</a>
          <form className="d-flex">
            <button className="btn btn-outline-success">{account}</button>
          </form>
        </div>
      </nav>
      <div className="mainPart">
        <div className="m-3 alert alert-primary" role="alert">
          Total Product Count is {productsCount}
        </div>
        <div class="card m-3">
          <div class="card-header bg-dark text-white">Welcome To Shop</div>
          <div class="card-body">
            <blockquote class="blockquote mb-0">
              <h2>Add your products now to our descentralize applications.</h2>
              <footer class="blockquote-footer">By Zoubair Hattab</footer>
            </blockquote>
          </div>
        </div>
        <div className="Productinputs container">
          <div className="input-group mb-3">
            <span className="input-group-text" id="inputGroup-sizing-default">
              Product Name
            </span>
            <input
              type="text"
              className="form-control"
              aria-label="Sizing example input"
              aria-describedby="inputGroup-sizing-default"
              onChange={(e) =>
                setProductInputs({ ...productInputs, name: e.target.value })
              }
            />
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text">Enter Ether Value</span>
            <input
              type="text"
              className="form-control"
              aria-label="Amount (to the nearest dollar)"
              onChange={(e) =>
                setProductInputs({ ...productInputs, price: e.target.value })
              }
            />
            <span className="input-group-text">ETH</span>
          </div>
          <div className="input-group">
            <span className="input-group-text">Product Description</span>
            <textarea
              className="form-control"
              aria-label="With textarea"
              onChange={(e) =>
                setProductInputs({
                  ...productInputs,
                  description: e.target.value,
                })
              }
            ></textarea>
          </div>
          <button
            type="button "
            className="btn btn-success p-auto m-3"
            onClick={addProduct}
          >
            Add Products
          </button>
        </div>
      </div>
     {
       productsCount>=1 ? <div className="container m-3 alert alert-danger" role="alert">
       <h4> Product Can Buy It</h4>
      </div>: <div className="container m-3 alert alert-primary" role="alert">
      <h4>No Products now</h4>
      </div>
     }
     <div className="container">
       <div className="row">

      
      {loading ? (
        <p>loading.......</p>
       ) : (
        products.map((item, index) => {
          return (
            <>
             
              <div className="container col-lg-4 col-md-6 col-sm-12">
                <div className=" card m-1 bg-dark">
                  <div className="card-header bg-light text-black"><h5>{item.name}</h5></div>
                  <div className="card-body">
                   <div className="p-1 m-1 alert alert-warning" role="alert">
                   <h4> Price:{Web3.utils.fromWei(item.price, "ether")} ETH
                    </h4>
                    </div>
                    <div className="p-1 m-1 alert alert-danger" role="alert">
                    <p className="card-text">Product Description: {item.description}</p>

                    </div>
                    <div className="p-1 m-1 alert alert-danger" role="alert">
                    <p className="card-text">
                   <h6 className="text-success">   The Seller Adressis:{item.owner}</h6>
                    </p>
                    </div>

                    <button
                      type="button "
                      className="btn btn-success p-2 m-3"
                      onClick={() => buyProduct(item.id, item.price)}
                    >
Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        })
      )}
       </div>
     </div>
         {
       productsSold.length>=1 ? <div className="container m-3 alert alert-danger" role="alert">
       <h4> Product Solded </h4>
      </div>: <div className="container m-3 alert alert-warning" role="alert">
      <h4>No Products Soled Yet</h4>
      </div>
     }
     <div className="container">
       <div className="row">
      {loading ? (
        <p>loading.......</p>
       ) : (
        productsSold.map((item, index) => {
          return (
            <>
             
              <div className="container col-lg-4 col-md-6 col-sm-12">
                <div className=" card m-5 bg-dark">
                  <div className="card-header bg-danger text-white"><h5>{item.name}</h5></div>
                  <div className="card-body">
                   <div className="p-1 m-1 alert alert-warning" role="alert">
                   <h4> Price:{Web3.utils.fromWei(item.price, "ether")} ETH
                    </h4>
                    </div>
                    <div className="p-1 m-1 alert alert-danger" role="alert">
                    <p className="card-text">Product Description: {item.description}</p>

                    </div>
                    <div className="p-1 m-1 alert alert-danger" role="alert">
                    <p className="card-text">
                   <h6 className="text-success">   The Seller Adressis:{item.owner}</h6>
                    </p>
                    </div>

                
                  </div>
                </div>
              </div>
            </>
          );
        })
      )}
       </div>
     </div>
    </div>
  );
}

export default App;
