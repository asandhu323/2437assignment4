"use strict";
$(document).ready(function () {
    $("#submit").click(function () {
        $.ajax({
            url: "/authenticate",
            type: "POST",
            dataType: "JSON",
            data: {
                email: $("#email").val(),
                password: $("#password").val()
            },
            success: function (data) {
                if (data['status'] == "success") {
                    window.location.replace("/profile");
                } else {
                    $("#errorMsg").html(data['msg']);
                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                $("#errorMsg").text(jqXHR.statusText);
            }
        });

    });

});