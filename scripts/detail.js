const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const product = dataStore[id];

if (product) {
  document.getElementById("detail").innerHTML = `
  
    <div style="
      background:white;
      border:1px solid #e5e7eb;
      border-radius:14px;
      padding:24px;
      display:flex;
      gap:24px;
      align-items:flex-start;
      max-width:700px;
      margin:50px auto;
      box-shadow:0 2px 12px rgba(0,0,0,0.07);
    ">

      <img 
        src="${product.image}" 
        style="
          width:180px;
          height:180px;
          object-fit:contain;
          border-radius:8px;
          border:1px solid #f3f4f6;
          padding:8px;
          background:#fafafa;
          flex-shrink:0;
        "
      >

      <div>
        <h1 style="
          margin:0 0 12px;
          font-size:28px;
          color:#111827;
        ">
          ${product.title}
        </h1>

        <p style="
          margin:0 0 16px;
          font-size:24px;
          font-weight:bold;
          color:#92400e;
        ">
          $${product.price}
        </p>

        <p style="
          margin:0;
          font-size:15px;
          line-height:1.7;
          color:#6b7280;
        ">
          ${product.description}
        </p>

        <button 
          onclick="window.history.back()"
          style="
            margin-top:20px;
            padding:10px 18px;
            border:none;
            border-radius:8px;
            background:black;
            color:white;
            cursor:pointer;
          "
        >
          Kembali
        </button>
      </div>

    </div>

  `;
}