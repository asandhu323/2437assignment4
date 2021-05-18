$(function () {
    "use strict";

    $("#submit").on('click', function () {
        $.ajax({
            url: "/authenticate",
            type: "POST",
            dataType: "JSON",
            data: {
                name: $("#name").val(),
                password: $("#password").val()
            },
            success: function (data) {
                if (data['status'] == "success") {
                    window.location.replace("/main");
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