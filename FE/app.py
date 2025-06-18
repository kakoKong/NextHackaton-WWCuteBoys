import streamlit as st
import requests
import time 

BASE_URL = "http://localhost:8001"  # Your FastAPI backend

st.title("👗 Vibey.AI Assistant (Streaming Test)")

with st.form("ask_form"):
    question = st.text_input("📝 Question", "What sizes are available and how should I care for this item?")
    reference = st.text_area("📦 Product Info", "Red summer dress, 100% cotton, available in multiple sizes, priced at $49.99, located on Floor 2 Section A")
    submitted = st.form_submit_button("Ask")

if submitted:
    st.markdown("### 🤖 AI Response (Streaming)")
    response_area = st.empty()
    full_response = ""

    try:
        with requests.post(
            f"{BASE_URL}/generation_stream",
            json={"question": question, "reference": reference},
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=60
        ) as response:
            if response.status_code == 200:
                for chunk in response.iter_content(chunk_size=1):
                    # time.sleep(0.1)
                    if chunk:
                        full_response += chunk.decode("utf-8")
                        # Update as plain text with line breaks as they appear
                        response_area.text(full_response)
            else:
                st.error(f"❌ Server returned {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        st.error(f"❌ Request failed: {e}")