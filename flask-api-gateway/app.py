from flask import Flask, request, jsonify, Response
import requests
import os

app = Flask(__name__)

ODK_BASE = "https://odk.zanzibar.openg2p.org"

# -----------------------------
# Health check
# -----------------------------
@app.route("/health")
def health():
    return {"status": "ok"}, 200


# -----------------------------
# Login
# -----------------------------
@app.route("/v1/sessions", methods=["POST"])
def login():
    try:
        resp = requests.post(
            f"{ODK_BASE}/v1/sessions",
            json=request.json,
            headers={"Content-Type": "application/json"},
            verify=True
        )
        # Forward response (including cookies) to client
        response = Response(resp.content, status=resp.status_code)
        # Copy all Set-Cookie headers from ODK
        if "set-cookie" in resp.headers:
            response.headers["Set-Cookie"] = resp.headers["set-cookie"]
        return response
    except Exception as e:
        return {"error": str(e)}, 502


# -----------------------------
# List submissions
# -----------------------------
@app.route("/v1/projects/3/forms/zups_beneficiary_form/submissions", methods=["GET"])
def list_submissions():
    auth_cookie = request.headers.get("Cookie")
    if not auth_cookie:
        return {"error": "Authorization cookie missing"}, 401

    try:
        resp = requests.get(
            f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions",
            headers={"Cookie": auth_cookie},
            params=request.args,
            verify=True
        )
        return Response(resp.content, status=resp.status_code, content_type=resp.headers.get("Content-Type"))
    except Exception as e:
        return {"error": str(e)}, 502


# -----------------------------
# Single submission
# -----------------------------
@app.route("/v1/projects/3/forms/zups_beneficiary_form/submissions/<submission_id>", methods=["GET"])
def single_submission(submission_id):
    auth_cookie = request.headers.get("Cookie")
    if not auth_cookie:
        return {"error": "Authorization cookie missing"}, 401

    try:
        resp = requests.get(
            f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions/{submission_id}",
            headers={"Cookie": auth_cookie},
            verify=True
        )
        return Response(resp.content, status=resp.status_code, content_type=resp.headers.get("Content-Type"))
    except Exception as e:
        return {"error": str(e)}, 502


# -----------------------------
# POST submission (XML + attachments)
# -----------------------------
@app.route("/v1/projects/3/forms/zups_beneficiary_form/submissions", methods=["POST"])
def post_submission():
    auth_cookie = request.headers.get("Cookie")
    if not auth_cookie:
        return {"error": "Authorization cookie missing"}, 401

    try:
        # Check if request is multipart/form-data
        if request.content_type.startswith("multipart/form-data"):
            files = {}
            xml_file = None
            for key in request.files:
                f = request.files[key]
                if key == "xml_submission_file":
                    xml_file = (f.filename, f.read(), f.content_type)
                else:
                    files[key] = (f.filename, f.read(), f.content_type)

            if not xml_file:
                return {"error": "Missing xml_submission_file"}, 400

            # Step 1: Submit XML
            resp = requests.post(
                f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions",
                files={"xml_submission_file": xml_file},
                headers={"Cookie": auth_cookie},
                verify=True
            )
            if resp.status_code >= 400:
                return Response(resp.content, status=resp.status_code)

            # Extract instanceID from XML
            import re
            xml_content = xml_file[1].decode("utf-8")
            instance_match = re.search(r"<instanceID>([^<]+)</instanceID>", xml_content)
            if not instance_match:
                return {"error": "Cannot find instanceID in XML"}, 400
            instance_id = instance_match.group(1)

            # Step 2: Upload attachments
            for key, value in files.items():
                requests.post(
                    f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions/{instance_id}/attachments/{value[0]}",
                    data=value[1],
                    headers={"Content-Type": value[2], "Cookie": auth_cookie},
                    verify=True
                )

            return Response(resp.content, status=resp.status_code)

        else:
            # Plain XML
            xml_data = request.data
            resp = requests.post(
                f"{ODK_BASE}/v1/projects/3/forms/zups_beneficiary_form/submissions",
                data=xml_data,
                headers={"Content-Type": "application/xml", "Cookie": auth_cookie},
                verify=True
            )
            return Response(resp.content, status=resp.status_code)
    except Exception as e:
        return {"error": str(e)}, 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
