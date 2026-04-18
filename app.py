from flask import Flask, render_template, jsonify, request
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
import json

app = Flask(__name__)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

@app.route('/')
def index():
    try:
        response = supabase.table('menu_items').select("*").execute()
        menu = response.data if response.data else []
        print(f"✅ Fetched {len(menu)} menu items from Supabase")  # Debug in terminal
        return render_template('index.html', menu=menu)
    except Exception as e:
        print(f"❌ Error fetching menu: {e}")
        return render_template('index.html', menu=[])

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.get_json()
    response = supabase.table('orders').insert({
        "items": data['items'],
        "total": data['total']
    }).execute()
    return jsonify({"success": True, "order_id": response.data[0]['id']})

@app.route('/api/menu')
def get_menu():
    response = supabase.table('menu_items').select("*").execute()
    return jsonify(response.data)

if __name__ == '__main__':
    app.run(debug=True)