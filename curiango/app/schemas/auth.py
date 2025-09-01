from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

bp = Blueprint("auth", __name__)

# Dummy login - substitua por validação real
@bp.post("/login")
def login():
    data = request.get_json() or {}
    username = data.get("username")
    if not username:
        return jsonify({"msg": "username requerido"}), 400
    return jsonify({
        "access_token": create_access_token(identity=username),
        "refresh_token": create_refresh_token(identity=username)
    })

@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    return jsonify({"access_token": create_access_token(identity=identity)})